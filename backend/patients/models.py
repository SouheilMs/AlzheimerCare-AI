from django.conf import settings
from django.db import models

from doctors.models import DoctorProfile


class PatientProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="patient_profile",
    )
    birth_date = models.DateField(null=True, blank=True)
    pseudonym = models.CharField(max_length=64, unique=True)

    def __str__(self) -> str:
        return f"PatientProfile<{self.user.email}>"


class DoctorPatientAssignment(models.Model):
    doctor = models.ForeignKey(
        DoctorProfile,
        on_delete=models.CASCADE,
        related_name="assignments",
    )
    patient = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name="assignments",
    )
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("doctor", "patient")

    def __str__(self) -> str:
        return f"Assignment<{self.doctor_id}:{self.patient_id}>"
