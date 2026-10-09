from django.db import models
from django.db.models import Q
from doctors.models import DoctorProfile
from patients.models import PatientProfile

class MedicalReport(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        AWAITING_VALIDATION = "awaiting_validation", "Awaiting validation"
        VALIDATED = "validated", "Validated"

    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name="reports")
    author = models.ForeignKey(DoctorProfile, null=True, blank=True, on_delete=models.SET_NULL, related_name="authored_reports")
    validated_by = models.ForeignKey(DoctorProfile, null=True, blank=True, on_delete=models.SET_NULL, related_name="validated_reports")
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.DRAFT)
    summary = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    validated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            # Rule 4: only a doctor can move a report to "validated".
            models.CheckConstraint(
                condition=~Q(status="validated") | Q(validated_by__isnull=False),
                name="report_validated_requires_doctor",
            )
        ]