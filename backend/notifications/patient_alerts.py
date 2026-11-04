import logging

from django.conf import settings
from django.core.mail import send_mail

from notifications.models import Notification

logger = logging.getLogger(__name__)


def notify_patient_follow_up(scan) -> None:
    """Après une analyse IRM à risque élevé : propose au patient de prendre rendez-vous.

    Envoie une notification dans l'application + un email. Le message reste volontairement
    neutre (ni pourcentage, ni nom de maladie) : le médecin annonce le résultat en consultation.
    """
    if not getattr(settings, "MRI_AUTO_NOTIFY_PATIENT", True):
        return

    score = scan.risk_score
    if score is None or score < settings.MRI_HIGH_RISK_THRESHOLD:
        return

    patient_user = scan.patient.user
    path = f"/patient/appointments?book=1&scan={scan.pk}"

    # Une seule alerte par IRM, même si le médecin relance l'analyse
    if Notification.objects.filter(user=patient_user, link=path).exists():
        return

    try:
        Notification.objects.create(
            user=patient_user,
            message="Votre IRM a été analysée : un rendez-vous de suivi avec votre médecin est recommandé.",
            link=path,
        )
        if patient_user.email:
            send_mail(
                subject="Un rendez-vous de suivi vous est recommandé - AlzheimerCare AI",
                message=(
                    "Bonjour,\n\n"
                    "Suite à l'analyse de votre dernière IRM, votre équipe médicale vous recommande "
                    "de prendre rendez-vous pour un suivi.\n"
                    f"Choisissez votre médecin et un créneau : {settings.FRONTEND_BASE_URL}{path}\n\n"
                    "AlzheimerCare AI"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[patient_user.email],
                fail_silently=False,
            )
    except Exception:
        # Un problème d'email ne doit jamais faire échouer l'analyse
        logger.exception("Notification de suivi échouée pour l'IRM %s", scan.pk)
