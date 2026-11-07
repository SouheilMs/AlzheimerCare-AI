from django.utils import timezone
from rest_framework import serializers

from appointments.models import Appointment


def _can_cancel(appointment: Appointment) -> bool:
    return appointment.status == Appointment.Status.SCHEDULED and appointment.starts_at > timezone.now()


class BookAppointmentSerializer(serializers.Serializer):
    doctor_id = serializers.IntegerField()
    starts_at = serializers.DateTimeField()
    mode = serializers.ChoiceField(choices=Appointment.Mode.choices, required=False)


class AppointmentSerializer(serializers.ModelSerializer):
    doctor_email = serializers.EmailField(source="doctor.user.email", read_only=True)
    doctor_name = serializers.SerializerMethodField()
    can_cancel = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            "id",
            "doctor",
            "doctor_email",
            "doctor_name",
            "title",
            "starts_at",
            "ends_at",
            "mode",
            "status",
            "can_cancel",
        ]

    def get_doctor_name(self, obj) -> str:
        user = obj.doctor.user
        full_name = f"{user.first_name} {user.last_name}".strip()
        return f"Dr. {full_name}" if full_name else user.email

    def get_can_cancel(self, obj) -> bool:
        return _can_cancel(obj)


class DoctorAppointmentSerializer(serializers.ModelSerializer):
    """Vue médecin : indique de quel patient il s'agit (pour ouvrir son dossier)."""

    patient_id = serializers.IntegerField(source="patient.pk", read_only=True)
    patient_pseudonym = serializers.CharField(source="patient.pseudonym", read_only=True)
    patient_email = serializers.EmailField(source="patient.user.email", read_only=True)
    can_cancel = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            "id",
            "patient_id",
            "patient_pseudonym",
            "patient_email",
            "title",
            "starts_at",
            "ends_at",
            "mode",
            "status",
            "can_cancel",
        ]

    def get_can_cancel(self, obj) -> bool:
        return _can_cancel(obj)
