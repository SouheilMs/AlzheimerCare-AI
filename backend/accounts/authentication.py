from __future__ import annotations

import json
import threading
import time
from urllib.request import urlopen

import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import authentication, exceptions

from accounts.models import UserRole
from audit_logs.services import create_audit_entry

User = get_user_model()


class KeycloakJwksCache:
    _lock = threading.Lock()
    _jwks: dict | None = None
    _fetched_at = 0.0

    @classmethod
    def get_jwks(cls) -> dict:
        with cls._lock:
            now = time.time()
            if cls._jwks and (now - cls._fetched_at) < settings.KEYCLOAK_JWKS_CACHE_TTL:
                return cls._jwks
            with urlopen(settings.KEYCLOAK_JWKS_URL, timeout=5) as response:
                payload = response.read().decode("utf-8")
            cls._jwks = json.loads(payload)
            cls._fetched_at = now
            return cls._jwks


class KeycloakAuthentication(authentication.BaseAuthentication):
    www_authenticate_realm = "api"

    def authenticate(self, request):
        auth = authentication.get_authorization_header(request).split()
        if not auth:
            return None
        if auth[0].lower() not in (b"bearer", b"token"):
            raise exceptions.AuthenticationFailed("Invalid authorization header")
        if len(auth) != 2:
            raise exceptions.AuthenticationFailed("Invalid bearer token")

        token = auth[1].decode("utf-8")
        payload = self._decode_and_validate(token)
        user = self._get_or_sync_user(request, payload)
        return (user, payload)

    def _decode_and_validate(self, token: str) -> dict:
        try:
            header = jwt.get_unverified_header(token)
        except jwt.PyJWTError as exc:
            raise exceptions.AuthenticationFailed("Invalid token header") from exc

        key = self._resolve_signing_key(header.get("kid"))
        try:
            return jwt.decode(
                token,
                key=key,
                algorithms=["RS256"],
                audience=settings.KEYCLOAK_TOKEN_AUDIENCE,
                issuer=settings.KEYCLOAK_EXPECTED_ISSUER,
                leeway=settings.KEYCLOAK_CLOCK_SKEW_SECONDS,
                options={"require": ["exp", "iss", "aud", "sub"]},
            )
        except jwt.ExpiredSignatureError as exc:
            raise exceptions.AuthenticationFailed("Token expired") from exc
        except jwt.InvalidTokenError as exc:
            raise exceptions.AuthenticationFailed("Invalid token") from exc

    def _resolve_signing_key(self, kid: str | None):
        if not kid:
            raise exceptions.AuthenticationFailed("Missing key identifier")
        jwks = KeycloakJwksCache.get_jwks()
        keys = jwks.get("keys", [])
        jwk = next((item for item in keys if item.get("kid") == kid), None)
        if not jwk:
            KeycloakJwksCache._jwks = None
            jwks = KeycloakJwksCache.get_jwks()
            keys = jwks.get("keys", [])
            jwk = next((item for item in keys if item.get("kid") == kid), None)
        if not jwk:
            raise exceptions.AuthenticationFailed("Unable to resolve signing key")
        return jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(jwk))

    def _get_or_sync_user(self, request, payload: dict):
        keycloak_id = payload.get("sub")
        email = payload.get("email", "").lower()
        role = self._resolve_role(payload)

        if not keycloak_id or not email:
            raise exceptions.AuthenticationFailed("Missing required claims")

        with transaction.atomic():
            user, created = User.objects.select_for_update().get_or_create(
                keycloak_id=keycloak_id,
                defaults={
                    "email": email,
                    "role": role,
                    "is_active": True,
                },
            )

            updated_fields: list[str] = []
            previous_role = user.role
            if user.email != email:
                user.email = email
                updated_fields.append("email")
            if user.role != role:
                user.role = role
                updated_fields.append("role")
            if not user.is_active:
                user.is_active = True
                updated_fields.append("is_active")
            if updated_fields:
                user.save(update_fields=updated_fields)

            if created:
                create_audit_entry(
                    user=user,
                    action="first_login_provisioned",
                    target_model="User",
                    target_object_id=user.pk,
                    path=request.path,
                    method=request.method,
                    metadata={"role": user.role},
                )
            elif previous_role != user.role:
                create_audit_entry(
                    user=user,
                    action="role_synced_from_token",
                    target_model="User",
                    target_object_id=user.pk,
                    path=request.path,
                    method=request.method,
                    metadata={"previous_role": previous_role, "new_role": user.role},
                )

        return user

    @staticmethod
    def _resolve_role(payload: dict) -> str:
        token_roles = set(payload.get("realm_access", {}).get("roles", []))
        if UserRole.ADMIN in token_roles:
            return UserRole.ADMIN
        if UserRole.DOCTOR in token_roles:
            return UserRole.DOCTOR
        if UserRole.PATIENT in token_roles:
            return UserRole.PATIENT
        raise exceptions.AuthenticationFailed("No supported realm role found")

    def authenticate_header(self, request):
        return f'Token realm="{self.www_authenticate_realm}"'
