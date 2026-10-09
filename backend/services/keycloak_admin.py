from __future__ import annotations

from dataclasses import dataclass

import requests
from django.conf import settings


class KeycloakAdminError(Exception):
    pass


@dataclass
class KeycloakUser:
    id: str
    email: str
    enabled: bool
    realm_roles: list[str]


class KeycloakAdminClient:
    def __init__(self):
        self.base_realm_url = f"{settings.KEYCLOAK_SERVER_URL}/admin/realms/{settings.KEYCLOAK_REALM}"
        self.token_url = f"{settings.KEYCLOAK_SERVER_URL}/realms/{settings.KEYCLOAK_REALM}/protocol/openid-connect/token"

    def _access_token(self) -> str:
        response = requests.post(
            self.token_url,
            data={
                "grant_type": "client_credentials",
                "client_id": settings.KEYCLOAK_BACKEND_CLIENT_ID,
                "client_secret": settings.KEYCLOAK_BACKEND_CLIENT_SECRET,
            },
            timeout=10,
        )
        if not response.ok:
            raise KeycloakAdminError("Unable to authenticate to Keycloak admin API")
        token = response.json().get("access_token")
        if not token:
            raise KeycloakAdminError("Missing access token from Keycloak")
        return token

    def _request(self, method: str, path: str, **kwargs):
        token = self._access_token()
        headers = kwargs.pop("headers", {})
        headers["Authorization"] = "Bearer " + token
        headers.setdefault("Content-Type", "application/json")
        response = requests.request(
            method,
            f"{self.base_realm_url}{path}",
            headers=headers,
            timeout=10,
            **kwargs,
        )
        return response

    def create_user(self, *, email: str, role: str, temporary_password: str | None = None):
        payload = {
            "username": email,
            "email": email,
            "enabled": True,
            "emailVerified": False,
            "requiredActions": ["VERIFY_EMAIL"],
        }
        if temporary_password:
            payload["credentials"] = [{"type": "password", "value": temporary_password, "temporary": True}]

        response = self._request("POST", "/users", json=payload)
        if response.status_code not in (201, 204):
            raise KeycloakAdminError("Failed to create Keycloak user")

        user_id = response.headers.get("Location", "").rstrip("/").split("/")[-1]
        if not user_id:
            user_id = self.find_user_by_email(email).id

        self.set_user_roles(user_id, [role])
        self.send_set_password_email(user_id)
        return user_id

    def delete_user(self, user_id: str):
        response = self._request("DELETE", f"/users/{user_id}")
        if response.status_code not in (204, 404):
            raise KeycloakAdminError("Failed to rollback Keycloak user")

    def enable_disable_user(self, user_id: str, enabled: bool):
        response = self._request("PUT", f"/users/{user_id}", json={"enabled": enabled})
        if response.status_code != 204:
            raise KeycloakAdminError("Failed to update user status")

    def list_users(self) -> list[KeycloakUser]:
        response = self._request("GET", "/users")
        if not response.ok:
            raise KeycloakAdminError("Failed to list users")
        users = []
        for item in response.json():
            realm_roles = self.user_roles(item["id"])
            users.append(
                KeycloakUser(
                    id=item["id"],
                    email=item.get("email", ""),
                    enabled=item.get("enabled", False),
                    realm_roles=realm_roles,
                )
            )
        return users

    def find_user_by_email(self, email: str) -> KeycloakUser:
        response = self._request("GET", f"/users?email={email}")
        if not response.ok:
            raise KeycloakAdminError("Failed to query user by email")
        users = response.json()
        if not users:
            raise KeycloakAdminError("User not found")
        user = users[0]
        return KeycloakUser(
            id=user["id"],
            email=user.get("email", ""),
            enabled=user.get("enabled", False),
            realm_roles=self.user_roles(user["id"]),
        )

    def send_set_password_email(self, user_id: str):
        response = self._request("PUT", f"/users/{user_id}/execute-actions-email", json=["UPDATE_PASSWORD"])
        if response.status_code != 204:
            raise KeycloakAdminError("Failed to trigger set-password email")

    def set_user_roles(self, user_id: str, roles: list[str]):
        all_roles_response = self._request("GET", "/roles")
        if not all_roles_response.ok:
            raise KeycloakAdminError("Failed to list roles")
        all_roles = {item["name"]: item for item in all_roles_response.json()}

        selected_roles = []
        for role in roles:
            if role not in all_roles:
                raise KeycloakAdminError(f"Invalid role: {role}")
            selected_roles.append(all_roles[role])

        current = self._request("GET", f"/users/{user_id}/role-mappings/realm")
        if current.ok and current.json():
            self._request("DELETE", f"/users/{user_id}/role-mappings/realm", json=current.json())

        assign = self._request("POST", f"/users/{user_id}/role-mappings/realm", json=selected_roles)
        if assign.status_code != 204:
            raise KeycloakAdminError("Failed to assign realm role")

    def user_roles(self, user_id: str) -> list[str]:
        response = self._request("GET", f"/users/{user_id}/role-mappings/realm")
        if not response.ok:
            raise KeycloakAdminError("Failed to fetch user roles")
        return [role["name"] for role in response.json()]
