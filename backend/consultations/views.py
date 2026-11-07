import hmac
import threading

from django.conf import settings
from django.db.models import F, TextField, Value
from django.db.models.functions import Concat
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from appointments.models import Appointment
from audit_logs.services import create_audit_entry
from consultations.models import Consultation
from consultations.report import build_report
from consultations.services import build_token, join_window, start_agent


def _load(request, appointment_id):
    """Retourne (appointment, role) ou (None, None) si l'utilisateur n'est pas concerné."""
    appointment = get_object_or_404(
        Appointment.objects.select_related("patient__user", "doctor__user"), pk=appointment_id
    )
    if appointment.patient.user_id == request.user.id:
        return appointment, "patient"
    if appointment.doctor.user_id == request.user.id:
        return appointment, "doctor"
    return None, None


class JoinConsultationView(APIView):
    """POST /api/consultations/<appointment_id>/join/  body: {"consent": true} (patient)."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, appointment_id):
        appointment, role = _load(request, appointment_id)
        if appointment is None:
            return Response({"detail": "Accès refusé"}, status=status.HTTP_403_FORBIDDEN)
        if appointment.mode != Appointment.Mode.VIDEO:
            return Response({"detail": "Ce rendez-vous n'est pas en visio."}, status=status.HTTP_400_BAD_REQUEST)
        if appointment.status != Appointment.Status.SCHEDULED:
            return Response({"detail": "Ce rendez-vous n'est plus actif."}, status=status.HTTP_400_BAD_REQUEST)

        opens_at, closes_at = join_window(appointment)
        now = timezone.now()
        if now < opens_at:
            return Response(
                {"detail": "La salle n'est pas encore ouverte.", "opens_at": opens_at.isoformat()},
                status=status.HTTP_403_FORBIDDEN,
            )
        if now > closes_at:
            return Response({"detail": "La salle est fermée."}, status=status.HTTP_403_FORBIDDEN)

        consultation, _ = Consultation.objects.get_or_create(appointment=appointment)
        if consultation.status == Consultation.Status.ENDED:
            return Response({"detail": "Cette consultation est terminée."}, status=status.HTTP_409_CONFLICT)

        if role == "patient" and consultation.patient_consent_at is None:
            if request.data.get("consent") is not True:
                return Response(
                    {"detail": "Le consentement du patient est requis pour entrer."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            consultation.patient_consent_at = now

        if consultation.started_at is None:
            consultation.started_at = now
        consultation.status = Consultation.Status.IN_PROGRESS
        consultation.save()

        if role == "doctor":
            u = request.user
            name = f"Dr. {u.first_name} {u.last_name}".strip() or u.email
        else:
            name = appointment.patient.pseudonym

        token = build_token(
            identity=f"{role}-{request.user.id}", name=name, room_name=consultation.room_name
        )

        create_audit_entry(
            user=request.user,
            action="consultation_joined",
            target_model="Consultation",
            target_object_id=consultation.pk,
            path=request.path,
            method=request.method,
            metadata={"role": role},
        )

        # Le consentement est donné : l'agent IA entre dans la salle tout seul
        if consultation.patient_consent_at is not None:
            start_agent(consultation.room_name)

        return Response(
            {
                "token": token,
                "url": settings.LIVEKIT_URL,
                "room": consultation.room_name,
                "role": role,
                "patient_consent": consultation.patient_consent_at is not None,
                "patient_name": appointment.patient.pseudonym,
                "doctor_email": appointment.doctor.user.email,
                "starts_at": appointment.starts_at.isoformat(),
            }
        )


class EndConsultationView(APIView):
    """POST /api/consultations/<appointment_id>/end/ : réservé au médecin."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, appointment_id):
        appointment, role = _load(request, appointment_id)
        if role != "doctor":
            return Response({"detail": "Seul le médecin peut terminer la consultation."}, status=status.HTTP_403_FORBIDDEN)
        consultation = get_object_or_404(Consultation, appointment=appointment)
        if consultation.status != Consultation.Status.ENDED:
            consultation.status = Consultation.Status.ENDED
            consultation.ended_at = timezone.now()
            consultation.save(update_fields=["status", "ended_at"])
            threading.Thread(target=build_report, args=(consultation.pk,), daemon=True).start()
        return Response({"status": consultation.status})


class AgentSegmentView(APIView):
    """POST /api/consultations/internal/segments/ : appelé uniquement par le robot."""

    authentication_classes = []
    permission_classes = []
    throttle_classes = []

    def post(self, request):
        secret = request.headers.get("X-Agent-Secret", "")
        expected = settings.AGENT_SHARED_SECRET
        if not expected or not hmac.compare_digest(secret, expected):
            return Response({"detail": "Refusé"}, status=status.HTTP_403_FORBIDDEN)

        consultation = get_object_or_404(Consultation, room_name=request.data.get("room"))
        if consultation.patient_consent_at is None:
            return Response({"detail": "Pas de consentement"}, status=status.HTTP_403_FORBIDDEN)

        speaker = str(request.data.get("speaker", "?"))[:20]
        text = str(request.data.get("text", "")).strip()
        if not text:
            return Response({"detail": "Texte vide"}, status=status.HTTP_400_BAD_REQUEST)

        line = f"[{speaker}] {text}\n"
        Consultation.objects.filter(pk=consultation.pk).update(
            transcript=Concat(F("transcript"), Value(line), output_field=TextField())
        )
        return Response({"ok": True})


class ConsultationReportView(APIView):
    """GET : lire la fiche. PATCH : la modifier. POST : la valider. Réservé au médecin."""

    permission_classes = [permissions.IsAuthenticated]

    def _consultation(self, request, appointment_id):
        appointment, role = _load(request, appointment_id)
        if role != "doctor":
            return None, None
        return appointment, get_object_or_404(Consultation, appointment=appointment)

    def get(self, request, appointment_id):
        appointment, c = self._consultation(request, appointment_id)
        if c is None:
            return Response({"detail": "Accès refusé"}, status=status.HTTP_403_FORBIDDEN)
        return Response(
            {
                "patient": appointment.patient.pseudonym,
                "starts_at": appointment.starts_at.isoformat(),
                "started_at": c.started_at.isoformat() if c.started_at else None,
                "ended_at": c.ended_at.isoformat() if c.ended_at else None,
                "status": c.status,
                "summary": c.summary,
                "transcript": c.transcript,
                "validated_at": c.report_validated_at.isoformat() if c.report_validated_at else None,
            }
        )

    def patch(self, request, appointment_id):
        _, c = self._consultation(request, appointment_id)
        if c is None:
            return Response({"detail": "Accès refusé"}, status=status.HTTP_403_FORBIDDEN)
        summary = request.data.get("summary")
        if not isinstance(summary, dict):
            return Response({"detail": "Résumé invalide"}, status=status.HTTP_400_BAD_REQUEST)
        c.summary = summary
        c.report_validated_at = None
        c.save(update_fields=["summary", "report_validated_at"])
        return Response({"ok": True})

    def post(self, request, appointment_id):
        _, c = self._consultation(request, appointment_id)
        if c is None:
            return Response({"detail": "Accès refusé"}, status=status.HTTP_403_FORBIDDEN)
        c.report_validated_at = timezone.now()
        c.save(update_fields=["report_validated_at"])
        return Response({"validated_at": c.report_validated_at.isoformat()})


class PatientConsultationsView(APIView):
    """GET /api/consultations/patient/<patient_id>/ : fiches des consultations terminées."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, patient_id):
        qs = (
            Consultation.objects.filter(
                appointment__patient_id=patient_id,
                appointment__doctor__user=request.user,
                status=Consultation.Status.ENDED,
            )
            .select_related("appointment")
            .order_by("-appointment__starts_at")
        )
        return Response(
            [
                {
                    "appointment_id": c.appointment_id,
                    "starts_at": c.appointment.starts_at.isoformat(),
                    "motif": (c.summary or {}).get("motif", ""),
                    "mots_cles": (c.summary or {}).get("mots_cles", []),
                    "validated": c.report_validated_at is not None,
                }
                for c in qs
            ]
        )