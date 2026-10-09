from django.db import models

class Game(models.Model):
    name = models.CharField(max_length=120)
    duration_minutes = models.PositiveSmallIntegerField()
    level = models.CharField(max_length=60)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]