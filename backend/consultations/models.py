import uuid

from django.db import models

from appointments.models import Appointment


def _room_name() -> str:
    return f"consult-{uuid.uuid4().hex[:16]}"


class Consultation(models.Model):
    class Status(models.TextChoices):
        WAITING = "waiting", "En attente"
        IN_PROGRESS = "in_progress", "En cours"
        ENDED = "ended", "Terminée"

    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name="consultation")
    room_name = models.CharField(max_length=64, unique=True, default=_room_name)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.WAITING)
    patient_consent_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    # Rempli plus tard par l'agent IA (étape 2, après la consultation)
    transcript = models.TextField(blank=True)
    summary = models.JSONField(default=dict, blank=True)
    report_validated_at = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        return f"Consultation {self.room_name} ({self.status})"
