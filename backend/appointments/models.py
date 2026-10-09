from django.db import models
from django.db.models import F, Q
from doctors.models import DoctorProfile
from patients.models import PatientProfile

class Appointment(models.Model):
    class Mode(models.TextChoices):
        IN_PERSON = "in-person", "In person"
        VIDEO = "video", "Video"

    class Status(models.TextChoices):
        SCHEDULED = "scheduled", "Scheduled"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name="appointments")
    doctor = models.ForeignKey(DoctorProfile, on_delete=models.CASCADE, related_name="appointments")
    title = models.CharField(max_length=160)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    mode = models.CharField(max_length=20, choices=Mode.choices, default=Mode.IN_PERSON)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["starts_at"]
        constraints = [models.CheckConstraint(condition=Q(ends_at__gt=F("starts_at")), name="appointment_ends_after_start")]