from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from django.conf import settings
from django.utils import timezone

from appointments.models import Appointment
from doctors.models import DoctorProfile
from patients.models import DoctorPatientAssignment
from django.db import transaction
from notifications.models import Notification

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


def selectable_doctors(patient):
    """Médecins que le patient peut choisir : ses médecins assignés, sinon tous les médecins."""
    assigned_ids = list(
        DoctorPatientAssignment.objects.filter(patient=patient).values_list("doctor_id", flat=True)
    )
    doctors = DoctorProfile.objects.select_related("user")
    if assigned_ids:
        doctors = doctors.filter(pk__in=assigned_ids)
    return doctors.order_by("pk")


def find_best_doctor_slots(patient, limit=5):
    """Retourne (doctor, slots) pour le médecin dont le créneau libre est le plus proche."""
    best = None
    for doctor in selectable_doctors(patient):
        slots = get_free_slots(doctor, limit=limit)
        if not slots:
            continue
        if best is None or slots[0][0] < best[1][0][0]:
            best = (doctor, slots)
    return best

class SlotUnavailable(Exception):
    pass


def book_appointment(patient, doctor_id, starts_at, mode=Appointment.Mode.IN_PERSON):
    """Réserve un créneau. Lève SlotUnavailable s'il n'est plus libre."""
    with transaction.atomic():
        # Verrou sur le médecin : deux réservations simultanées passent l'une après l'autre
        doctor = DoctorProfile.objects.select_for_update().get(pk=doctor_id)

        free = get_free_slots(doctor, limit=10_000)
        ends_at = next((e for s, e in free if s == starts_at), None)
        if ends_at is None:
            raise SlotUnavailable()

        appointment = Appointment.objects.create(
            patient=patient,
            doctor=doctor,
            title="Consultation de suivi (IRM à risque élevé)",
            starts_at=starts_at,
            ends_at=ends_at,
            mode=mode,
        )

        # Le médecin doit pouvoir ouvrir le dossier de ce patient
        DoctorPatientAssignment.objects.get_or_create(doctor=doctor, patient=patient)

        local_start = starts_at.astimezone(ZoneInfo(settings.APPOINTMENT_TIMEZONE))
        Notification.objects.create(
            user=doctor.user,
            link="/doctor/appointments",
            message=(
                f"Nouveau patient ({patient.pseudonym}) : rendez-vous le "
                f"{local_start:%d/%m/%Y} à {local_start:%H:%M}."
            ),
        )
    return appointment
