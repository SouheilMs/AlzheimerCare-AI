import { Video } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui'

const MINUTES_BEFORE = 15 // doit rester identique à CONSULTATION_JOIN_MINUTES_BEFORE (backend)
const MINUTES_AFTER = 15

interface Props {
  appointmentId: number
  mode: 'in-person' | 'video'
  startsAt: string
  endsAt: string
  status?: string
}

const hhmm = (d: Date) =>
  new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Tunis' }).format(d)

export const JoinConsultationButton = ({ appointmentId, mode, startsAt, endsAt, status }: Props) => {
  const navigate = useNavigate()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15_000)
    return () => window.clearInterval(id)
  }, [])

  if (mode !== 'video' || (status && status !== 'scheduled')) return null

  const opensAt = new Date(startsAt).getTime() - MINUTES_BEFORE * 60_000
  const closesAt = new Date(endsAt).getTime() + MINUTES_AFTER * 60_000
  if (now > closesAt) return null

  const open = now >= opensAt
  return (
    <Button
      disabled={!open}
      onClick={(e) => {
        e.preventDefault() // le bouton peut se trouver dans un <Link>
        e.stopPropagation()
        navigate(`/consultation/${appointmentId}`)
      }}
    >
      <Video size={16} className="mr-2 inline" />
      {open ? 'Rejoindre la visio' : `Visio ouverte à ${hhmm(new Date(opensAt))}`}
    </Button>
  )
}
