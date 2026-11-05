import io
import os
import time
from math import gcd

import numpy as np
import soundfile as sf
from fastapi import FastAPI, File, Form, UploadFile
from faster_whisper import WhisperModel
from scipy.signal import resample_poly

MODEL_NAME = os.getenv("WHISPER_MODEL", "small")
DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
COMPUTE = os.getenv("WHISPER_COMPUTE", "int8")

_lang = os.getenv("WHISPER_LANGUAGE", "ar")
LANGUAGE = None if _lang == "auto" else _lang

_use_prompt = os.getenv("WHISPER_PROMPT", "1") == "1"
PROMPT = (
    "أهلا دكتور، عندي des oublis و problème de mémoire، نحب نعمل l'IRM و le traitement."
    if _use_prompt
    else None
)

model = WhisperModel(MODEL_NAME, device=DEVICE, compute_type=COMPUTE)
app = FastAPI()


@app.get("/health")
def health():
    return {"ok": True, "model": MODEL_NAME, "language": _lang, "prompt": _use_prompt}


@app.post("/transcribe")
def transcribe(file: UploadFile = File(...), speaker: str = Form("")):
    raw = file.file.read()

    os.makedirs("debug", exist_ok=True)
    with open(f"debug/{speaker}_{int(time.time())}.wav", "wb") as f:
        f.write(raw)

    data, sample_rate = sf.read(io.BytesIO(raw), dtype="float32")
    if data.ndim > 1:
        data = data.mean(axis=1)

    if sample_rate != 16000:
        g = gcd(16000, sample_rate)
        data = resample_poly(data, 16000 // g, sample_rate // g).astype("float32")

    peak = float(np.max(np.abs(data))) if data.size else 0.0
    if peak > 0:
        data = data / peak * 0.9

    segments, info = model.transcribe(
        data,
        language=LANGUAGE,
        initial_prompt=PROMPT,
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 500, "threshold": 0.3},
        beam_size=5,
        condition_on_previous_text=False,
    )
    text = " ".join(s.text.strip() for s in segments).strip()
    return {"text": text, "language": info.language, "probability": 1.0}