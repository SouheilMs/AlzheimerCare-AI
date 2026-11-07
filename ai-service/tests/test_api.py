import io
import zipfile

import pytest
from fastapi.testclient import TestClient
from PIL import Image

import main

SCORES = [0.9] * 12 + [0.2] * 4  # moyenne 0.725 ; 12 coupes sur 16 concordent avec « risque »


def _zip(count=16) -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        for i in range(count):
            png = io.BytesIO()
            Image.new("L", (32, 32), 100).save(png, format="PNG")
            z.writestr(f"s{i:02d}.png", png.getvalue())
    return buf.getvalue()


@pytest.fixture()
def client(monkeypatch):
    monkeypatch.setenv("PRELOAD_MODEL", "0")
    monkeypatch.setenv("AI_SERVICE_TOKEN", "secret-de-test")
    monkeypatch.setattr(main, "_run_inference", lambda images: SCORES)
    return TestClient(main.app)


def _post(client, data, token="secret-de-test"):
    headers = {"X-Service-Token": token} if token is not None else {}
    return client.post("/predict", files={"file": ("irm.zip", data, "application/zip")}, headers=headers)


def test_health_is_public(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_predict_requires_token(client):
    assert _post(client, _zip(), token=None).status_code == 401
    assert _post(client, _zip(), token="mauvais").status_code == 401


def test_predict_ok(client):
    response = _post(client, _zip())
    assert response.status_code == 200
    body = response.json()
    assert body["risk_score"] == pytest.approx(0.725, abs=0.01)
    assert body["confidence"] == 0.75
    assert body["confidence_method"] == "slice_agreement"
    assert body["simulated"] is False
    assert len(body["slice_scores"]) == 16


def test_predict_rejects_bad_archive(client):
    response = _post(client, _zip(count=3))
    assert response.status_code == 400
    assert "16 images PNG attendues" in response.json()["detail"]


def test_dev_mode_without_token(monkeypatch):
    monkeypatch.delenv("AI_SERVICE_TOKEN", raising=False)
    monkeypatch.setattr(main, "_run_inference", lambda images: SCORES)
    assert _post(TestClient(main.app), _zip(), token=None).status_code == 200


def test_metrics_exposed(client):
    _post(client, _zip())
    text = client.get("/metrics").text
    assert "ai_predictions_total" in text
    assert "ai_inference_seconds_bucket" in text


def test_aggregate_agreement():
    result = main.aggregate([0.1, 0.2, 0.3, 0.9])
    assert result["risk_score"] == 0.38
    assert result["confidence"] == 0.75  # 3 coupes sur 4 vont dans le sens « faible risque »
