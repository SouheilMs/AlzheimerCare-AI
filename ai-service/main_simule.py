import hashlib

from fastapi import FastAPI, File, UploadFile

app = FastAPI(title="AlzheimerCare AI Service")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)) -> dict:
    # SIMULATION : à remplacer par le vrai modèle deep learning
    content = await file.read()
    digest = int(hashlib.sha256(content).hexdigest(), 16)
    risk_score = round(0.2 + (digest % 76) / 100, 2)
    return {
        "risk_score": risk_score,
        "confidence": 0.5,
        "model_version": "simulated-0",
        "simulated": True,
    }