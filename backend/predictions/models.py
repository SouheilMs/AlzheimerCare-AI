from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from patients.models import PatientProfile

_unit = [MinValueValidator(0.0), MaxValueValidator(1.0)]

class Prediction(models.Model):
    class State(models.TextChoices):
        STABLE = "stable", "Stable"
        TO_MONITOR = "to_monitor", "To monitor"
        LIKELY_PROGRESSION = "likely_progression", "Likely progression"
        INSUFFICIENT_DATA = "insufficient_data", "Insufficient data"

    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name="predictions")
    state = models.CharField(max_length=24, choices=State.choices)
    risk_score = models.FloatField(validators=_unit)
    confidence = models.FloatField(validators=_unit)
    data_quality = models.CharField(max_length=120, blank=True)
    influential_factors = models.JSONField(default=list, blank=True)
    model_version = models.CharField(max_length=64)  # required: rule 3
    horizon_months = models.PositiveSmallIntegerField(default=12)
    summary = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class Alert(models.Model):
    class Severity(models.TextChoices):
        LOW = "low", "Low"
        MODERATE = "moderate", "Moderate"
        HIGH = "high", "High"

    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name="alerts")
    prediction = models.ForeignKey(Prediction, null=True, blank=True, on_delete=models.SET_NULL, related_name="alerts")
    severity = models.CharField(max_length=10, choices=Severity.choices)
    summary = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]