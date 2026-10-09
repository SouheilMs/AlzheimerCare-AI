from unittest.mock import MagicMock, patch

import pytest
from rest_framework.test import APIClient

from accounts.models import User, UserRole
from audit_logs.models import AuditLog


@pytest.mark.django_db
def test_admin_create_user_calls_keycloak_client_and_audit_logs():
    admin = User.objects.create_user(email="admin@example.com", role=UserRole.ADMIN, keycloak_id="admin-sub")
    client = APIClient()
    client.force_authenticate(user=admin)

    mock_client = MagicMock()
    mock_client.create_user.return_value = "kc-user-1"

    with patch("accounts.views.KeycloakAdminClient", return_value=mock_client):
        response = client.post(
            "/api/auth/admin/users/",
            {"email": "new-doctor@example.com", "role": "doctor"},
            format="json",
        )

    assert response.status_code == 201
    mock_client.create_user.assert_called_once()
    assert User.objects.filter(keycloak_id="kc-user-1", role=UserRole.DOCTOR).exists()
    assert AuditLog.objects.filter(action="admin_created_user").exists()


@pytest.mark.django_db
def test_admin_disable_user_calls_keycloak_and_writes_audit_log():
    admin = User.objects.create_user(email="admin@example.com", role=UserRole.ADMIN, keycloak_id="admin-sub")
    target = User.objects.create_user(email="target@example.com", role=UserRole.PATIENT, keycloak_id="target-sub")

    client = APIClient()
    client.force_authenticate(user=admin)

    mock_client = MagicMock()

    with patch("accounts.views.KeycloakAdminClient", return_value=mock_client):
        response = client.patch(
            f"/api/auth/admin/users/{target.keycloak_id}/",
            {"enabled": False},
            format="json",
        )

    assert response.status_code == 200
    mock_client.enable_disable_user.assert_called_once_with(target.keycloak_id, False)
    target.refresh_from_db()
    assert target.is_active is False
    assert AuditLog.objects.filter(action="admin_disabled_user").exists()
