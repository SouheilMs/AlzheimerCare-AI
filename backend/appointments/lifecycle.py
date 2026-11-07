"""Annulation et rappels de rendez-vous."""
import logging
from datetime import timedelta
from zoneinfo import ZoneInfo

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone

from appointments.models import Appointment
from notifications.models import Notification

logger = logging.getLogger(__name__)


class CancellationNotAllowed(Exception):
    """Le rendez-vous ne peut plus être annulé (déjà annulé, terminé ou passé)."""


def _local(dt):
    return dt.astimezone(ZoneInfo(settings.APPOINTMENT_TIMEZONE))


def _notify(user, message: str, link: str, subject: str, body: str) -> None:
    """Notification dans l'application + email. Un échec d'email ne bloque jamais l'action."""
    try:
        Notification.objects.create(user=user, message=message[:255], link=link)
        if user.email:
            send_mail(
                subject=subject,
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
    except Exception:
        logger.exception("Notification échouée pour l'utilisateur %s", getattr(user, "pk", None))


def cancel_appointment(appointment: Appointment, cancelled_by: str) -> Appointment:
    """Annule un rendez-vous (cancelled_by : "patient" ou "doctor") et prévient l'autre partie.

    Le créneau redevient libre automatiquement : get_free_slots() ne compte que les
    rendez-vous « scheduled ».
    """
    with transaction.atomic():
        appt = (
            Appointment.objects.select_for_update()
            .select_related("patient__user", "doctor__user")
            .get(pk=appointment.pk)
        )
        if appt.status != Appointment.Status.SCHEDULED:
            raise CancellationNotAllowed("Ce rendez-vous n'est plus actif.")
        if appt.starts_at <= timezone.now():
            raise CancellationNotAllowed("Un rendez-vous déjà commencé ou passé ne peut pas être annulé.")
        appt.status = Appointment.Status.CANCELLED
        appt.save(update_fields=["status"])

    when = _local(appt.starts_at)
    when_text = f"{when:%d/%m/%Y} à {when:%H:%M}"

    if cancelled_by == "patient":
        _notify(
            appt.doctor.user,
            f"Rendez-vous annulé par {appt.patient.pseudonym} ({when_text}).",
            "/doctor/appointments",
            "Rendez-vous annulé - AlzheimerCare AI",
            (
                "Bonjour,\n\n"
                f"Le patient {appt.patient.pseudonym} a annulé son rendez-vous du {when_text}.\n"
                "Le créneau est de nouveau disponible.\n\nAlzheimerCare AI"
            ),
        )
    else:
        _notify(
            appt.patient.user,
            f"Votre rendez-vous du {when_text} a été annulé par votre médecin.",
            "/patient/appointments?book=1",
            "Votre rendez-vous a été annulé - AlzheimerCare AI",
            (
                "Bonjour,\n\n"
                f"Votre médecin a dû annuler le rendez-vous prévu le {when_text}.\n"
                f"Vous pouvez choisir un nouveau créneau : {settings.FRONTEND_BASE_URL}/patient/appointments?book=1\n\n"
                "AlzheimerCare AI"
            ),
        )
    return appt


def send_due_reminders(now=None) -> int:
    """Envoie un rappel (notification + email) aux patients dont le rendez-vous a lieu dans
    moins de APPOINTMENT_REMINDER_HOURS heures (et dans plus d'1 heure).

    Idempotent : un seul rappel par rendez-vous, même si la tâche tourne toutes les heures
    (la notification créée sert de marqueur grâce à son lien unique). Retourne le nombre
    de rappels envoyés.
    """
    now = now or timezone.now()
    hours = getattr(settings, "APPOINTMENT_REMINDER_HOURS", 24)
    due = (
        Appointment.objects.filter(
            status=Appointment.Status.SCHEDULED,
            starts_at__gt=now + timedelta(hours=1),
            starts_at__lte=now + timedelta(hours=hours),
        )
        .select_related("patient__user", "doctor__user")
        .order_by("starts_at")
    )

    sent = 0
    for appt in due:
        link = f"/patient/appointments?reminder={appt.pk}"
        patient_user = appt.patient.user
        if Notification.objects.filter(user=patient_user, link=link).exists():
            continue

        when = _local(appt.starts_at)
        doctor_name = f"{appt.doctor.user.first_name} {appt.doctor.user.last_name}".strip()
        doctor_label = f"Dr. {doctor_name}" if doctor_name else "votre médecin"
        when_text = f"{when:%d/%m/%Y} à {when:%H:%M}"

        extra = ""
        if appt.mode == Appointment.Mode.VIDEO:
            minutes = getattr(settings, "CONSULTATION_JOIN_MINUTES_BEFORE", 15)
            extra = (
                f"\nIl s'agit d'une consultation en visio : le bouton « Rejoindre la visio » "
                f"s'activera {minutes} minutes avant l'heure du rendez-vous.\n"
            )

        _notify(
            patient_user,
            f"Rappel : rendez-vous avec {doctor_label} le {when_text}.",
            link,
            "Rappel de rendez-vous - AlzheimerCare AI",
            (
                "Bonjour,\n\n"
                f"Nous vous rappelons votre rendez-vous avec {doctor_label} le {when_text}.\n"
                f"{extra}\n"
                f"Gérer vos rendez-vous : {settings.FRONTEND_BASE_URL}/patient/appointments\n\n"
                "AlzheimerCare AI"
            ),
        )
        sent += 1
    return sent
