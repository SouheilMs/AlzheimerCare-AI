"""Inférence ResNet18 (importé à la demande : main.py reste testable sans torch)."""
import os
import threading

import torch
import torch.nn as nn
from torchvision import models, transforms

MODEL_PATH = os.getenv("MODEL_PATH", "/app/models/modele_final_graine1.pt")

MEAN = [0.485, 0.456, 0.406]
STD = [0.229, 0.224, 0.225]

_transform = transforms.Compose(
    [
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(MEAN, STD),
    ]
)

_model = None
_lock = threading.Lock()


def get_model() -> nn.Module:
    """Charge le modèle une seule fois (thread-safe)."""
    global _model
    if _model is None:
        with _lock:
            if _model is None:
                model = models.resnet18(weights=None)
                model.fc = nn.Linear(model.fc.in_features, 2)
                model.load_state_dict(torch.load(MODEL_PATH, map_location="cpu"))
                model.eval()
                _model = model
    return _model


def predict_slices(images) -> list[float]:
    """Probabilité de la classe « risque » (indice 1) pour chaque coupe."""
    model = get_model()
    batch = torch.stack([_transform(img.convert("RGB")) for img in images])
    with torch.inference_mode():
        probas = torch.softmax(model(batch), dim=1)[:, 1]
    return [float(p) for p in probas]
