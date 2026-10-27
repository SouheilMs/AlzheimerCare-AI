from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from django.conf import settings
from django.utils import timezone

from appointments.models import Appointment


def get_free_slots(doctor, limit=5):
    tz = ZoneInfo(settings.APPOINTMENT_TIMEZONE)
    now = timezone.now()
    step = timedelta(minutes=settings.APPOINTMENT_SLOT_MINUTES)
    window_end = now + timedelta(days=settings.APPOINTMENT_DAYS_AHEAD)

    busy = list(
        Appointment.objects.filter(
            doctor=doctor,
            status=Appointment.Status.SCHEDULED,
            starts_at__lt=window_end,
            ends_at__gt=now,
        ).values_list("starts_at", "ends_at")
    )

    slots = []
    first_day = now.astimezone(tz).date()
    for offset in range(settings.APPOINTMENT_DAYS_AHEAD + 1):
        day = first_day + timedelta(days=offset)
        if day.weekday() >= 5:
            continue
        start = datetime(day.year, day.month, day.day, settings.APPOINTMENT_WORK_START_HOUR, tzinfo=tz)
        end = datetime(day.year, day.month, day.day, settings.APPOINTMENT_WORK_END_HOUR, tzinfo=tz)
        while start + step <= end:
            slot_end = start + step
            is_free = not any(b_start < slot_end and b_end > start for b_start, b_end in busy)
            if start > now and is_free:
                slots.append((start, slot_end))
                if len(slots) >= limit:
                    return slots
            start = slot_end
    return slots