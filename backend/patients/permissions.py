from rest_framework.permissions import BasePermission, SAFE_METHODS

from accounts.models import UserRole
from audit_logs.services import create_audit_entry
from patients.models import DoctorPatientAssignment, PatientProfile


class IsPatient(BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.PATIENT)


class IsDoctor(BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.DOCTOR)


class IsAdmin(BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.ADMIN)


class IsNotAdminClinicalWrite(BasePermission):
    def has_permission(self, request, view) -> bool:
        denied = request.method not in SAFE_METHODS and request.user.role == UserRole.ADMIN
        if denied:
            target_object_id = view.kwargs.get("pk") if hasattr(view, "kwargs") else "unknown"
            create_audit_entry(
                user=request.user,
                action="permission_denied_sensitive_object",
                target_model="PatientProfile",
                target_object_id=target_object_id,
                path=request.path,
                method=request.method,
                metadata={"permission": self.__class__.__name__},
            )
        return not denied


class IsPatientSelf(BasePermission):
    def has_object_permission(self, request, view, obj: PatientProfile) -> bool:
        return bool(request.user.role == UserRole.PATIENT and obj.user_id == request.user.id)


class IsAssignedDoctor(BasePermission):
    def has_object_permission(self, request, view, obj: PatientProfile) -> bool:
        if request.user.role != UserRole.DOCTOR:
            return False
        return DoctorPatientAssignment.objects.filter(
            doctor__user_id=request.user.id,
            patient=obj,
        ).exists()


class IsPatientSelfOrAssignedDoctor(BasePermission):
    def has_object_permission(self, request, view, obj: PatientProfile) -> bool:
        if request.user.role == UserRole.ADMIN and request.method in SAFE_METHODS:
            return True
        allowed = IsPatientSelf().has_object_permission(request, view, obj) or IsAssignedDoctor().has_object_permission(request, view, obj)
        if not allowed:
            create_audit_entry(
                user=request.user,
                action="permission_denied_sensitive_object",
                target_model=obj.__class__.__name__,
                target_object_id=obj.pk,
                path=request.path,
                method=request.method,
                metadata={"permission": self.__class__.__name__},
            )
        return allowed
