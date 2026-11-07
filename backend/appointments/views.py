import hmac

from django.conf import settings
from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsDoctor, IsPatient
from appointments.lifecycle import CancellationNotAllowed, cancel_appointment, send_due_reminders
from appointments.models import Appointment
from appointments.serializers import (
    AppointmentSerializer,
    BookAppointmentSerializer,
    DoctorAppointmentSerializer,
)
from appointments.services import (
    SlotUnavailable,
    book_appointment,
    find_best_doctor_slots,
    get_free_slots,
    selectable_doctors,
)
from audit_logs.services import create_audit_entry
from doctors.models import DoctorProfile
from patients.models import DoctorPatientAssignment


def _patient_profile(request):
    return getattr(request.user, "patient_profile", None)


def _doctor_payload(doctor):
    user = doctor.user
    full_name = f"{user.first_name} {user.last_name}".strip()
    return {
        "id": doctor.pk,
        "email": user.email,
        "license_number": doctor.license_number,
        "name": f"Dr. {full_name}" if full_name else user.email,
        "specialty": doctor.specialty,
    }


class SuggestedSlotsView(APIView):
    """Créneaux libres les plus proches.

    Sans paramètre : le médecin avec le créneau le plus proche (comportement d'origine).
    ?doctor_id=<id> : les créneaux du médecin choisi (parmi ceux que le patient peut choisir).
    ?limit=<n>      : nombre de créneaux (5 par défaut, 200 au maximum).
    La réponse contient aussi "doctors" : la liste des médecins sélectionnables.
    """

    permission_classes = [permissions.IsAuthenticated, IsPatient]

    def get(self, request):
        profile = _patient_profile(request)
        if profile is None:
            return Response({"detail": "Patient profile not found"}, status=status.HTTP_404_NOT_FOUND)

        doctors = list(selectable_doctors(profile))
        if not doctors:
            return Response({"detail": "Aucun médecin disponible"}, status=status.HTTP_404_NOT_FOUND)

        try:
            limit = max(1, min(int(request.query_params.get("limit", 5)), 200))
        except ValueError:
            limit = 5

        doctor_id = request.query_params.get("doctor_id")
        if doctor_id:
            try:
                wanted = int(doctor_id)
            except ValueError:
                return Response({"detail": "doctor_id invalide"}, status=status.HTTP_400_BAD_REQUEST)
            doctor = next((d for d in doctors if d.pk == wanted), None)
            if doctor is None:
                return Response({"detail": "Médecin non autorisé"}, status=status.HTTP_403_FORBIDDEN)
            slots = get_free_slots(doctor, limit=limit)
        else:
            result = find_best_doctor_slots(profile, limit=limit)
            if result is None:
                return Response({"detail": "Aucun créneau disponible"}, status=status.HTTP_404_NOT_FOUND)
            doctor, slots = result

        return Response(
            {
                "doctor": _doctor_payload(doctor),
                "doctors": [_doctor_payload(d) for d in doctors],
                "slots": [{"starts_at": s.isoformat(), "ends_at": e.isoformat()} for s, e in slots],
            }
        )


class AppointmentListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsPatient]

    def get(self, request):
        profile = _patient_profile(request)
        if profile is None:
            return Response({"detail": "Patient profile not found"}, status=status.HTTP_404_NOT_FOUND)
        qs = Appointment.objects.filter(
            patient=profile, status=Appointment.Status.SCHEDULED, ends_at__gt=timezone.now()
        ).select_related("doctor__user")
        return Response(AppointmentSerializer(qs, many=True).data)

    def post(self, request):
        profile = _patient_profile(request)
        if profile is None:
            return Response({"detail": "Patient profile not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = BookAppointmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        doctor = DoctorProfile.objects.filter(pk=data["doctor_id"]).first()
        if doctor is None:
            return Response({"detail": "Médecin introuvable"}, status=status.HTTP_404_NOT_FOUND)

        assigned = list(
            DoctorPatientAssignment.objects.filter(patient=profile).values_list("doctor_id", flat=True)
        )
        if assigned and doctor.pk not in assigned:
            return Response({"detail": "Ce médecin n'est pas votre médecin référent"}, status=status.HTTP_403_FORBIDDEN)

        try:
            appointment = book_appointment(
                profile,
                doctor.pk,
                data["starts_at"],
                data.get("mode", Appointment.Mode.IN_PERSON),
            )
        except SlotUnavailable:
            return Response(
                {"detail": "Ce créneau n'est plus disponible, choisissez-en un autre."},
                status=status.HTTP_409_CONFLICT,
            )

        create_audit_entry(
            user=request.user,
            action="appointment_booked",
            target_model="Appointment",
            target_object_id=appointment.pk,
            path=request.path,
            method=request.method,
            metadata={"doctor_id": doctor.pk},
        )
        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_201_CREATED)


class DoctorAppointmentListView(APIView):
    """Les rendez-vous du médecin connecté.

    ?scope=upcoming (défaut) : rendez-vous à venir, du plus proche au plus lointain.
    ?scope=past              : rendez-vous passés ou annulés (50 derniers).
    """

    permission_classes = [permissions.IsAuthenticated, IsDoctor]

    def get(self, request):
        qs = Appointment.objects.filter(doctor__user=request.user).select_related("patient__user")
        now = timezone.now()
        if request.query_params.get("scope") == "past":
            qs = qs.filter(Q(ends_at__lte=now) | ~Q(status=Appointment.Status.SCHEDULED)).order_by("-starts_at")[:50]
        else:
            qs = qs.filter(status=Appointment.Status.SCHEDULED, ends_at__gt=now).order_by("starts_at")
        return Response(DoctorAppointmentSerializer(qs, many=True).data)


class AppointmentCancelView(APIView):
    """POST /api/appointments/<id>/cancel/ : le patient ou le médecin concerné annule le rendez-vous."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        appointment = (
            Appointment.objects.select_related("patient__user", "doctor__user").filter(pk=pk).first()
        )
        # 404 (et non 403) pour ne pas révéler l'existence des rendez-vous des autres
        if appointment is None:
            return Response({"detail": "Rendez-vous introuvable"}, status=status.HTTP_404_NOT_FOUND)

        if appointment.patient.user_id == request.user.pk:
            role, serializer_class = "patient", AppointmentSerializer
        elif appointment.doctor.user_id == request.user.pk:
            role, serializer_class = "doctor", DoctorAppointmentSerializer
        else:
            return Response({"detail": "Rendez-vous introuvable"}, status=status.HTTP_404_NOT_FOUND)

        try:
            cancelled = cancel_appointment(appointment, cancelled_by=role)
        except CancellationNotAllowed as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)

        create_audit_entry(
            user=request.user,
            action="appointment_cancelled",
            target_model="Appointment",
            target_object_id=cancelled.pk,
            path=request.path,
            method=request.method,
            metadata={"cancelled_by": role},
        )
        return Response(serializer_class(cancelled).data)


class InternalSendRemindersView(APIView):
    """POST /api/appointments/internal/send-reminders/ : appelé par n8n (ou cron) toutes les heures.

    Protégé par le secret partagé INTERNAL_API_TOKEN (en-tête X-Internal-Token).
    Désactivé tant que INTERNAL_API_TOKEN n'est pas défini.
    """

    authentication_classes: list = []
    permission_classes: list = []

    def post(self, request):
        expected = getattr(settings, "INTERNAL_API_TOKEN", "")
        provided = request.headers.get("X-Internal-Token", "")
        if not expected or not hmac.compare_digest(provided, expected):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        return Response({"sent": send_due_reminders()})
