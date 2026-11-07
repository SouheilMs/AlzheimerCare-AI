import hmac
import logging
import os
import threading
import time
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, File, Header, HTTPException, Response, UploadFile
from fastapi.concurrency import run_in_threadpool
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest

from zip_utils import MAX_ZIP_BYTES, InvalidUpload, extract_slices

logger = logging.getLogger("ai-service")

MODEL_VERSION = os.getenv("MODEL_VERSION", "resnet18-adni-oasis-graine1")

PREDICTIONS = Counter("ai_predictions_total", "Analyses IRM demandées", ["status"])
INFERENCE_SECONDS = Histogram(
    "ai_inference_seconds",
    "Durée totale d'une analyse (validation + inférence)",
    buckets=(0.1, 0.25, 0.5, 1, 2, 5, 10, 30, 60),
)
RISK_SCORE = Histogram(
    "ai_risk_score",
    "Distribution des scores de risque produits",
    buckets=(0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0),
)


def _preload_model() -> None:
    try:
        import inference

        inference.get_model()
        logger.info("Modèle chargé : %s", inference.MODEL_PATH)
    except Exception:  # le service reste démarré ; /predict répondra 503
        logger.exception("Impossible de charger le modèle au démarrage")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    if not os.getenv("AI_SERVICE_TOKEN"):
        logger.warning("AI_SERVICE_TOKEN non défini : /predict est accessible sans authentification !")
    if os.getenv("PRELOAD_MODEL", "1") == "1":
        threading.Thread(target=_preload_model, daemon=True).start()
    yield


app = FastAPI(title="AlzheimerCare AI Service", lifespan=lifespan)


def require_token(x_service_token: str | None = Header(default=None)) -> None:
    """Secret partagé entre Django et ce service (en-tête X-Service-Token)."""
    expected = os.getenv("AI_SERVICE_TOKEN", "")
    if not expected:
        return  # mode développement : pas de jeton configuré
    if not x_service_token or not hmac.compare_digest(x_service_token, expected):
        raise HTTPException(status_code=401, detail="Jeton de service invalide.")


def _run_inference(images) -> list[float]:
    import inference  # import tardif : torch n'est chargé que si on analyse vraiment

    return inference.predict_slices(images)


def aggregate(scores: list[float]) -> dict:
    """Résume les scores par coupe en un score patient et une mesure d'accord.

    - risk_score : moyenne des probabilités par coupe.
    - confidence : proportion de coupes qui vont dans le même sens que le résultat global
      (« cohérence entre coupes »). 1.0 = toutes les coupes concordent, 0.5 = modèle partagé.
    """
    score = sum(scores) / len(scores)
    positive = score >= 0.5
    agreement = sum(1 for s in scores if (s >= 0.5) == positive) / len(scores)
    return {
        "risk_score": round(score, 2),
        "confidence": round(agreement, 2),
        "slice_scores": [round(s, 3) for s in scores],
    }


def _analyse(data: bytes) -> dict:
    images = extract_slices(data)
    scores = _run_inference(images)
    return aggregate(scores)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/metrics")
def metrics() -> Response:
    # Réseau interne uniquement : ne publiez pas ce port à l'extérieur en production.
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.post("/predict", dependencies=[Depends(require_token)])
async def predict(file: UploadFile = File(...)) -> dict:
    started = time.perf_counter()
    data = await file.read(MAX_ZIP_BYTES + 1)
    try:
        result = await run_in_threadpool(_analyse, data)
    except InvalidUpload as exc:
        PREDICTIONS.labels("invalid").inc()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        PREDICTIONS.labels("error").inc()
        logger.error("Fichier modèle introuvable : %s", exc)
        raise HTTPException(status_code=503, detail="Modèle indisponible.") from exc
    except Exception as exc:
        PREDICTIONS.labels("error").inc()
        logger.exception("Erreur pendant l'inférence")
        raise HTTPException(status_code=500, detail="Erreur pendant l'analyse.") from exc

    PREDICTIONS.labels("ok").inc()
    INFERENCE_SECONDS.observe(time.perf_counter() - started)
    RISK_SCORE.observe(result["risk_score"])
    return {
        **result,
        "confidence_method": "slice_agreement",
        "model_version": MODEL_VERSION,
        "simulated": False,
    }
