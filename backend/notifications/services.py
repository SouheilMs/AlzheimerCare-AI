import logging

from django.conf import settings
from django.core.mail import send_mail

from notifications.models import Notification
from patients.models import DoctorPatientAssignment

logger = logging.getLogger(__name__)


def notify_doctors_new_mri(scan) -> None:
    """Notifie (application + email) chaque médecin assigné au patient."""
    patient = scan.patient
    path = f"/doctor/patients/{patient.pk}"
    assignments = DoctorPatientAssignment.objects.filter(patient=patient).select_related("doctor__user")

    for assignment in assignments:
        doctor_user = assignment.doctor.user
        try:
            Notification.objects.create(
                user=doctor_user,
                message=f"Nouvelle IRM déposée par {patient.pseudonym}.",
                link=path,
            )
            if doctor_user.email:
                send_mail(
                    subject="Nouvelle IRM à analyser - AlzheimerCare AI",
                    message=(
                        "Bonjour,\n\n"
                        f"Le patient {patient.pseudonym} vient de déposer une nouvelle IRM.\n"
                        f"Consultez sa fiche : {settings.FRONTEND_BASE_URL}{path}\n\n"
                        "AlzheimerCare AI"
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[doctor_user.email],
                    fail_silently=False,
                )
        except Exception:
            # Un problème d'email ne doit jamais faire échouer le dépôt de l'IRM
            logger.exception("Notification IRM échouée pour le médecin %s", assignment.doctor_id)