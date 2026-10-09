from django.conf import settings
from django.db import models


class DoctorProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="doctor_profile",
    )
    specialty = models.CharField(max_length=120, blank=True)
    license_number = models.CharField(max_length=64, unique=True)

    def __str__(self) -> str:
        return f"DoctorProfile<{self.user.email}>"
