from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from rest_framework.test import APIClient

from accounts.models import User, UserRole
from patients.models import PatientProfile


def generate_rsa_keypair():
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_key = private_key.public_key()
    jwk_dict = jwt.algorithms.RSAAlgorithm.to_jwk(public_key, as_dict=True)
    jwk_dict["kid"] = "test-kid"
    return private_key, {"keys": [jwk_dict]}


def make_token(private_key, *, sub: str = "sub-1", email: str = "patient@example.com", role: str = "patient", issuer: str = "http://localhost:8080/realms/alzheimercare", audience: str = "alzheimercare-frontend", expires_delta: timedelta = timedelta(minutes=5)):
    now = datetime.now(timezone.utc)
    payload = {
        "sub": sub,
        "email": email,
        "iss": issuer,
        "aud": audience,
        "iat": now,
        "exp": now + expires_delta,
        "realm_access": {"roles": [role]},
    }
    return jwt.encode(payload, private_key, algorithm="RS256", headers={"kid": "test-kid"})


@pytest.fixture
def jwks_keys(settings):
    private_key, jwks = generate_rsa_keypair()
    settings.KEYCLOAK_EXPECTED_ISSUER = "http://localhost:8080/realms/alzheimercare"
    settings.KEYCLOAK_TOKEN_AUDIENCE = "alzheimercare-frontend"
    settings.KEYCLOAK_CLOCK_SKEW_SECONDS = 0
    return private_key, jwks


@pytest.mark.django_db
def test_valid_token_accepted_and_user_provisioned(jwks_keys):
    private_key, jwks = jwks_keys
    token = make_token(private_key)

    with patch("accounts.authentication.KeycloakJwksCache.get_jwks", return_value=jwks):
        client = APIClient()
        response = client.get("/api/auth/me/", HTTP_AUTHORIZATION="Token " + token)

    assert response.status_code == 200
    user = User.objects.get(keycloak_id="sub-1")
    assert user.role == UserRole.PATIENT


@pytest.mark.django_db
@pytest.mark.parametrize(
    "token_factory",
    [
        lambda private_key: make_token(private_key, expires_delta=timedelta(minutes=-1)),
        lambda private_key: make_token(private_key, issuer="http://bad-issuer"),
        lambda private_key: make_token(private_key, audience="wrong-aud"),
    ],
)
def test_invalid_claims_rejected(jwks_keys, token_factory):
    private_key, jwks = jwks_keys
    token = token_factory(private_key)

    with patch("accounts.authentication.KeycloakJwksCache.get_jwks", return_value=jwks):
        client = APIClient()
        response = client.get("/api/auth/me/", HTTP_AUTHORIZATION="Token " + token)

    assert response.status_code == 401


@pytest.mark.django_db
def test_bad_signature_rejected(jwks_keys):
    _, jwks = jwks_keys
    rogue_key, _ = generate_rsa_keypair()
    token = make_token(rogue_key)

    with patch("accounts.authentication.KeycloakJwksCache.get_jwks", return_value=jwks):
        client = APIClient()
        response = client.get("/api/auth/me/", HTTP_AUTHORIZATION="Token " + token)

    assert response.status_code == 401


@pytest.mark.django_db
def test_missing_token_rejected():
    client = APIClient()
    response = client.get("/api/auth/me/")
    assert response.status_code == 401


@pytest.mark.django_db
def test_role_changes_from_keycloak_are_synced(jwks_keys):
    private_key, jwks = jwks_keys
    user = User.objects.create_user(email="doctor@example.com", role=UserRole.DOCTOR, keycloak_id="sub-1")
    PatientProfile.objects.create(user=user, pseudonym="patient-role-sync")

    token = make_token(private_key, sub="sub-1", email="doctor@example.com", role="patient")

    with patch("accounts.authentication.KeycloakJwksCache.get_jwks", return_value=jwks):
        client = APIClient()
        response = client.get("/api/auth/me/", HTTP_AUTHORIZATION="Token " + token)

    assert response.status_code == 200
    user.refresh_from_db()
    assert user.role == UserRole.PATIENT
