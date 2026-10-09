from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=100)
    target_model = models.CharField(max_length=100)
    target_object_id = models.CharField(max_length=100)
    path = models.CharField(max_length=255)
    method = models.CharField(max_length=16)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.action}:{self.target_model}:{self.target_object_id}"
