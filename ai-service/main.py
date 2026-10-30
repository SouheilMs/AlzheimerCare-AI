import io

import torch
import torch.nn as nn
import zipfile
from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image
from torchvision import models, transforms

CHEMIN_MODELE = "/app/models/modele_final_graine1.pt"

MEAN = [0.485, 0.456, 0.406]
STD = [0.229, 0.224, 0.225]

tf_eval = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(MEAN, STD),
])


def nouveau_modele():
    m = models.resnet18(weights=None)
    m.fc = nn.Linear(m.fc.in_features, 2)
    return m

modele = nouveau_modele()
modele.load_state_dict(torch.load(CHEMIN_MODELE, map_location="cpu"))
modele.eval()


def predire_patient(images):
    lot = torch.stack([tf_eval(img.convert("RGB")) for img in images])
    with torch.no_grad():
        probas = torch.softmax(modele(lot), dim=1)[:, 1]
    return float(probas.mean())

app = FastAPI(title="AlzheimerCare AI Service")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    contenu = await file.read()
    try:
        with zipfile.ZipFile(io.BytesIO(contenu)) as z:
            noms = sorted(
                n for n in z.namelist()
                if n.lower().endswith(".png") and "__macosx" not in n.lower()
            )
            images = [Image.open(io.BytesIO(z.read(n))) for n in noms]
    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="Envoyez un fichier ZIP contenant 16 images PNG.")

    if len(images) != 16:
        raise HTTPException(status_code=400, detail=f"16 images PNG attendues, {len(images)} reçues.")

    score = predire_patient(images)
    return {
        "risk_score": round(score, 2),
        "confidence": round(max(score, 1 - score), 2),
        "model_version": "resnet18-adni-oasis-graine1",
        "simulated": False,
    }