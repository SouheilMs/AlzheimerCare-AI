from django.urls import path

from accounts.views import (
    AdminUserDetailView,
    AdminUsersView,
    MeView,
    AdminResetPasswordView
)

urlpatterns = [
    path("me/", MeView.as_view(), name="auth-me"),
    path("admin/users/", AdminUsersView.as_view(), name="admin-users"),
    path("admin/users/<str:keycloak_id>/", AdminUserDetailView.as_view(), name="admin-user-detail"),
    path("admin/users/<str:keycloak_id>/reset-password/", AdminResetPasswordView.as_view(), name="admin-user-reset-password"),
]
