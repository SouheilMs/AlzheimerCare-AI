import requests
from django.conf import settings


class AIServiceError(Exception):
    pass


def predict_mri(scan) -> dict:
    try:
        with scan.file.open("rb") as f:
            response = requests.post(
                f"{settings.AI_SERVICE_URL}/predict",
                files={"file": (scan.file.name.split("/")[-1], f)},
                timeout=settings.AI_SERVICE_TIMEOUT,
            )
        response.raise_for_status()
        return response.json()
    except (requests.RequestException, ValueError) as exc:
        raise AIServiceError(str(exc)) from exc