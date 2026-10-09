from __future__ import annotations

from typing import Any

from audit_logs.models import AuditLog


def create_audit_entry(*, user, action: str, target_model: str, target_object_id: str, path: str, method: str, metadata: dict[str, Any] | None = None):
    AuditLog.objects.create(
        user=user if getattr(user, "is_authenticated", False) else None,
        action=action,
        target_model=target_model,
        target_object_id=str(target_object_id),
        path=path,
        method=method,
        metadata=metadata or {},
    )
