from django.shortcuts import render

# Create your views here.
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsPatient
from appointments.models import Appointment
from appointments.serializers import AppointmentSerializer, BookAppointmentSerializer
from appointments.services import SlotUnavailable, book_appointment, find_best_doctor_slots
from audit_logs.services import create_audit_entry
from doctors.models import DoctorProfile
from patients.models import DoctorPatientAssignment


def _patient_profile(request):
    return getattr(request.user, "patient_profile", None)


class SuggestedSlotsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsPatient]

    def get(self, request):
        profile = _patient_profile(request)
        if profile is None:
            return Response({"detail": "Patient profile not found"}, status=status.HTTP_404_NOT_FOUND)

        result = find_best_doctor_slots(profile)
        if result is None:
            return Response({"detail": "Aucun créneau disponible"}, status=status.HTTP_404_NOT_FOUND)

        doctor, slots = result
        return Response(
            {
                "doctor": {
                    "id": doctor.pk,
                    "email": doctor.user.email,
                    "license_number": doctor.license_number,
                },
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