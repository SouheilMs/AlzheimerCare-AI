from django.core.validators import MaxValueValidator
from django.db import models
from django.utils import timezone
from patients.models import PatientProfile

class CognitiveTest(models.Model):
    class TestType(models.TextChoices):
        MEMORY = "memory", "Memory"
        ATTENTION = "attention", "Attention"
        REGULARITY = "regularity", "Regularity"

    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name="cognitive_tests")
    test_type = models.CharField(max_length=20, choices=TestType.choices)
    score = models.PositiveSmallIntegerField(validators=[MaxValueValidator(100)])
    duration_seconds = models.PositiveIntegerField(default=0)
    answers = models.JSONField(default=dict, blank=True)
    taken_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-taken_at"]
        indexes = [models.Index(fields=["patient", "taken_at"])]