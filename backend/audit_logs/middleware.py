from django.http import HttpRequest

from audit_logs.models import AuditLog


class SensitiveAccessAuditMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest):
        response = self.get_response(request)
        if not request.path.startswith("/api/patients/"):
            return response
        if response.status_code >= 400:
            return response
        if not hasattr(request, "user"):
            return response

        object_id = request.resolver_match.kwargs.get("pk") if request.resolver_match else None
        if object_id is None:
            return response

        AuditLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            action="middleware_sensitive_access",
            target_model="PatientProfile",
            target_object_id=str(object_id),
            path=request.path,
            method=request.method,
            metadata={"source": "middleware"},
        )
        return response
