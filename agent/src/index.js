import { AccessToken } from 'livekit-server-sdk'
import { Room, RoomEvent, TrackKind, AudioStream } from '@livekit/rtc-node'
import express from 'express'

const STT_URL = process.env.STT_URL ?? 'http://localhost:8002'
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000'
const AGENT_SECRET = process.env.AGENT_SHARED_SECRET ?? ''
const THRESHOLD = Number(process.env.VOICE_THRESHOLD ?? 400)
const PORT = Number(process.env.PORT ?? 3001)
const SILENCE_MS = 1500
const MAX_SEGMENT_MS = 25_000
const MIN_SPEECH_MS = 600

const active = new Set() // salles où l'agent est déjà présent

const makeAgentToken = async (roomName) => {
  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    { identity: 'agent-ia', name: 'Agent IA' },
  )
  token.addGrant({ roomJoin: true, room: roomName, canSubscribe: true, canPublish: false })
  return await token.toJwt()
}

// Écrit un fichier WAV (en mémoire) à partir des échantillons
const toWav = (samples, sampleRate, channels) => {
  const data = Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength)
  const h = Buffer.alloc(44)
  h.write('RIFF', 0)
  h.writeUInt32LE(36 + data.length, 4)
  h.write('WAVE', 8)
  h.write('fmt ', 12)
  h.writeUInt32LE(16, 16)
  h.writeUInt16LE(1, 20)
  h.writeUInt16LE(channels, 22)
  h.writeUInt32LE(sampleRate, 24)
  h.writeUInt32LE(sampleRate * channels * 2, 28)
  h.writeUInt16LE(channels * 2, 32)
  h.writeUInt16LE(16, 34)
  h.write('data', 36)
  h.writeUInt32LE(data.length, 40)
  return Buffer.concat([h, data])
}

// File d'attente : les segments sont traités un par un
let queue = Promise.resolve()
const enqueue = (job) => {
  queue = queue.then(job).catch((e) => console.error('Erreur :', e.message, e.cause))
}

const sendSegment = async (roomName, speaker, wav) => {
  const form = new FormData()
  form.append('file', new Blob([wav], { type: 'audio/wav' }), 'segment.wav')
  form.append('speaker', speaker)

  const r = await fetch(`${STT_URL}/transcribe`, { method: 'POST', body: form })
  if (!r.ok) throw new Error(`Transcription refusée (${r.status})`)
  const { text, language } = await r.json()
  if (!text) return

  console.log(`[${speaker}] (${language}) ${text}`)

  const saved = await fetch(`${BACKEND_URL}/api/consultations/internal/segments/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Agent-Secret': AGENT_SECRET },
    body: JSON.stringify({ room: roomName, speaker, text, language }),
  })
  if (!saved.ok) console.error(`Django a refusé le texte (${saved.status})`)
}

// Termine le segment en cours et l'envoie à la transcription
const flush = (state, roomName, speaker) => {
  const enoughSpeech = state.speechMs >= MIN_SPEECH_MS
  const chunks = state.chunks
  const { sampleRate, channels } = state
  state.chunks = []
  state.totalMs = 0
  state.speechMs = 0
  state.silenceMs = 0
  state.speaking = false
  if (!enoughSpeech || chunks.length === 0) return

  const total = chunks.reduce((n, c) => n + c.length, 0)
  const all = new Int16Array(total)
  let offset = 0
  for (const c of chunks) {
    all.set(c, offset)
    offset += c.length
  }
  const wav = toWav(all, sampleRate, channels)
  enqueue(() => sendSegment(roomName, speaker, wav))
}

const listen = async (track, participant, roomName) => {
  const speaker = participant.identity.split('-')[0] // "doctor" ou "patient"
  const state = { chunks: [], totalMs: 0, speechMs: 0, silenceMs: 0, speaking: false, sampleRate: 16000, channels: 1 }
  console.log("J'écoute :", participant.identity)
  const preRoll = [] // derniers 400 ms avant la voix
  const PRE_ROLL_MS = 400
  let preRollMs = 0
  const stream = new AudioStream(track, 16000, 1)
  let first = true
  for await (const frame of stream) {
    if (first) {
      console.log(`Audio de ${speaker} : ${frame.sampleRate} Hz, ${frame.channels} canal`)
      first = false
    }
    state.sampleRate = frame.sampleRate
    state.channels = frame.channels

    const n = frame.data.length
    let sum = 0
    for (let i = 0; i < n; i++) sum += frame.data[i] * frame.data[i]
    const rms = Math.sqrt(sum / n)
    const ms = (n / frame.channels / frame.sampleRate) * 1000
    const copy = Int16Array.from(frame.data)

    if (rms > THRESHOLD) {
      if (!state.speaking) {
        // la voix commence : on récupère le tampon d'avant
        for (const c of preRoll) state.chunks.push(c)
        preRoll.length = 0
        preRollMs = 0
      }
      state.speaking = true
      state.silenceMs = 0
      state.speechMs += ms
    } else if (state.speaking) {
      state.silenceMs += ms
    }

    if (state.speaking) {
      state.chunks.push(copy)
      state.totalMs += ms
      if (state.silenceMs >= SILENCE_MS || state.totalMs >= MAX_SEGMENT_MS) {
        flush(state, roomName, speaker)
      }
    } else {
      preRoll.push(copy)
      preRollMs += ms
      while (preRollMs > PRE_ROLL_MS && preRoll.length > 1) {
        preRollMs -= (preRoll[0].length / frame.channels / frame.sampleRate) * 1000
        preRoll.shift()
      }
    }
  }
  flush(state, roomName, speaker) // la personne est partie : on garde sa dernière phrase
}

const joinRoom = async (roomName) => {
  const jwt = await makeAgentToken(roomName)
  const room = new Room()

  room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
    if (track.kind === TrackKind.KIND_AUDIO) {
      listen(track, participant, roomName).catch((e) => console.error('Erreur audio :', e.message))
    }
  })

  room.on(RoomEvent.ParticipantDisconnected, (participant) => {
    console.log('Parti :', participant.identity)
    if (room.remoteParticipants.size === 0) {
      setTimeout(async () => {
        if (room.remoteParticipants.size > 0) return // quelqu'un est revenu
        console.log('Salle vide : le robot sort de', roomName)
        await queue // laisse finir les transcriptions en cours
        await room.disconnect()
      }, 2000)
    }
  })

  room.on(RoomEvent.Disconnected, () => active.delete(roomName))

  await room.connect(process.env.LIVEKIT_URL, jwt)
  console.log('Le robot est dans la salle', roomName)
}

const startAgent = (roomName) => {
  if (active.has(roomName)) return false
  active.add(roomName)
  joinRoom(roomName).catch((e) => {
    console.error('Impossible de rejoindre', roomName, e.message)
    active.delete(roomName)
  })
  return true
}

// --- Petit serveur HTTP appelé par Django ---
const app = express()
app.use(express.json())

app.post('/join', (req, res) => {
  if (!AGENT_SECRET || req.get('X-Agent-Secret') !== AGENT_SECRET) {
    return res.status(403).json({ detail: 'Refusé' })
  }
  const room = String(req.body?.room ?? '')
  if (!/^consult-[a-f0-9]{16}$/.test(room)) {
    return res.status(400).json({ detail: 'Salle invalide' })
  }
  res.json({ started: startAgent(room) })
})

app.get('/health', (_req, res) => res.json({ ok: true, rooms: [...active] }))

app.listen(PORT, () => console.log(`Agent prêt sur le port ${PORT}`))

// Mode manuel toujours possible : npm start -- consult-xxx
if (process.argv[2]) startAgent(process.argv[2])