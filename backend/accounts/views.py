from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from accounts.models import UserRole
from accounts.permissions import IsAdmin
from accounts.serializers import (
    AdminChangeRoleSerializer,
    AdminCreateUserSerializer,
    AdminToggleUserSerializer,
    AuthMeSerializer,
)
from audit_logs.services import create_audit_entry
from services.keycloak_admin import KeycloakAdminClient, KeycloakAdminError

User = get_user_model()


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def get(self, request):
        serializer = AuthMeSerializer(request.user)
        return Response(serializer.data)


class AdminUsersView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def get(self, request):
        client = KeycloakAdminClient()
        try:
            users = client.list_users()
        except KeycloakAdminError:
            return Response({"detail": "Upstream identity provider error"}, status=status.HTTP_502_BAD_GATEWAY)

        return Response(
            [
                {
                    "keycloak_id": user.id,
                    "email": user.email,
                    "enabled": user.enabled,
                    "roles": user.realm_roles,
                }
                for user in users
            ]
        )

    def post(self, request):
        serializer = AdminCreateUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        client = KeycloakAdminClient()

        keycloak_id = None
        try:
            with transaction.atomic():
                keycloak_id = client.create_user(
                    email=payload["email"],
                    role=payload["role"],
                    temporary_password=payload.get("temporary_password"),
                )
                local_user, _ = User.objects.update_or_create(
                    keycloak_id=keycloak_id,
                    defaults={
                        "email": payload["email"],
                        "role": payload["role"],
                        "is_active": True,
                    },
                )
                create_audit_entry(
                    user=request.user,
                    action="admin_created_user",
                    target_model="User",
                    target_object_id=local_user.pk,
                    path=request.path,
                    method=request.method,
                    metadata={"keycloak_id": keycloak_id, "role": payload["role"]},
                )
        except Exception:  # noqa: BLE001
            if keycloak_id:
                try:
                    client.delete_user(keycloak_id)
                except KeycloakAdminError:
                    pass
            return Response({"detail": "Unable to create user"}, status=status.HTTP_502_BAD_GATEWAY)

        return Response(
            {
                "keycloak_id": keycloak_id,
                "email": payload["email"],
                "role": payload["role"],
            },
            status=status.HTTP_201_CREATED,
        )


class AdminUserDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def patch(self, request, keycloak_id: str):
        role_serializer = AdminChangeRoleSerializer(data=request.data)
        toggle_serializer = AdminToggleUserSerializer(data=request.data)

        client = KeycloakAdminClient()
        try:
            if "role" in request.data:
                role_serializer.is_valid(raise_exception=True)
                role = role_serializer.validated_data["role"]
                with transaction.atomic():
                    client.set_user_roles(keycloak_id, [role])
                    user = User.objects.filter(keycloak_id=keycloak_id).first()
                    if user:
                        previous_role = user.role
                        user.role = role
                        user.save(update_fields=["role"])
                        create_audit_entry(
                            user=request.user,
                            action="admin_changed_role",
                            target_model="User",
                            target_object_id=user.pk,
                            path=request.path,
                            method=request.method,
                            metadata={"previous_role": previous_role, "new_role": role},
                        )
                return Response({"detail": "Role updated"})

            if "enabled" in request.data:
                toggle_serializer.is_valid(raise_exception=True)
                enabled = toggle_serializer.validated_data["enabled"]
                with transaction.atomic():
                    client.enable_disable_user(keycloak_id, enabled)
                    user = User.objects.filter(keycloak_id=keycloak_id).first()
                    if user:
                        user.is_active = enabled
                        user.save(update_fields=["is_active"])
                        create_audit_entry(
                            user=request.user,
                            action="admin_enabled_user" if enabled else "admin_disabled_user",
                            target_model="User",
                            target_object_id=user.pk,
                            path=request.path,
                            method=request.method,
                            metadata={"enabled": enabled},
                        )
                return Response({"detail": "Status updated"})

            return Response({"detail": "No supported update field supplied"}, status=status.HTTP_400_BAD_REQUEST)
        except KeycloakAdminError:
            return Response({"detail": "Upstream identity provider error"}, status=status.HTTP_502_BAD_GATEWAY)
