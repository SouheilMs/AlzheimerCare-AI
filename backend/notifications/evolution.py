import logging

from django.conf import settings
from django.core.mail import send_mail

from notifications.models import Notification
from patients.models import DoctorPatientAssignment
from predictions.models import Alert

logger = logging.getLogger(__name__)


def _pct(value: float) -> int:
    return int(round(value * 100))


def notify_risk_evolution(scan) -> None:
    """Alerte les médecins du patient si le risque estimé a nettement augmenté.

    Compare cette IRM à l'IRM analysée juste avant (même patient). Si la hausse atteint
    MRI_EVOLUTION_DELTA (10 points par défaut), crée une notification + un email pour chaque
    médecin assigné, et une alerte « Alertes IA » visible sur le tableau de bord médecin.
    Une seule alerte par IRM, même si l'analyse est relancée.
    """
    if scan.risk_score is None:
        return

    delta_threshold = float(getattr(settings, "MRI_EVOLUTION_DELTA", 0.10))
    scan_model = type(scan)
    # pk plutôt que la date : plusieurs IRM peuvent être envoyées le même jour
    previous = (
        scan_model.objects.filter(patient=scan.patient, risk_score__isnull=False, pk__lt=scan.pk)
        .order_by("-pk")
        .first()
    )
    if previous is None:
        return

    delta = scan.risk_score - previous.risk_score
    if delta < delta_threshold:
        return

    patient = scan.patient
    before, after, points = _pct(previous.risk_score), _pct(scan.risk_score), _pct(delta)
    link = f"/doctor/patients/{patient.pk}?scan={scan.pk}&evolution=1"
    message = f"Évolution du risque pour {patient.pseudonym} : {before} % → {after} % (+{points} points)."

    try:
        severity = (
            Alert.Severity.HIGH
            if scan.risk_score >= settings.MRI_HIGH_RISK_THRESHOLD
            else Alert.Severity.MODERATE
        )
        summary = f"Hausse du risque estimé de {before} % à {after} % depuis l'IRM précédente."
        if not Alert.objects.filter(patient=patient, summary=summary).exists():
            Alert.objects.create(patient=patient, severity=severity, summary=summary)
    except Exception:
        logger.exception("Création de l'alerte d'évolution échouée pour l'IRM %s", scan.pk)

    assignments = DoctorPatientAssignment.objects.filter(patient=patient).select_related("doctor__user")
    for assignment in assignments:
        doctor_user = assignment.doctor.user
        if Notification.objects.filter(user=doctor_user, link=link).exists():
            continue
        try:
            Notification.objects.create(user=doctor_user, message=message[:255], link=link)
            if doctor_user.email:
                send_mail(
                    subject="Évolution du risque d'un patient - AlzheimerCare AI",
                    message=(
                        "Bonjour,\n\n"
                        f"{message}\n"
                        "Une relecture clinique de la dernière IRM est recommandée.\n"
                        f"Consultez sa fiche : {settings.FRONTEND_BASE_URL}/doctor/patients/{patient.pk}\n\n"
                        "Cette estimation est une aide à la décision et ne remplace pas un diagnostic.\n\n"
                        "AlzheimerCare AI"
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[doctor_user.email],
                    fail_silently=False,
                )
        except Exception:
            # Un problème d'email ne doit jamais faire échouer l'analyse
            logger.exception("Alerte d'évolution échouée pour le médecin %s", assignment.doctor_id)
