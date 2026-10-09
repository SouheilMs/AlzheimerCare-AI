from audit_logs.models import AuditLog


class SensitiveObjectAuditMixin:
    audit_action = "sensitive_read"

    def log_sensitive_access(self, request, obj):
        AuditLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            action=self.audit_action,
            target_model=obj.__class__.__name__,
            target_object_id=str(obj.pk),
            path=request.path,
            method=request.method,
            metadata={"view": self.__class__.__name__},
        )
