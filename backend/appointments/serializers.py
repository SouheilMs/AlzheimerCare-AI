from rest_framework import serializers

from appointments.models import Appointment


class BookAppointmentSerializer(serializers.Serializer):
    doctor_id = serializers.IntegerField()
    starts_at = serializers.DateTimeField()
    mode = serializers.ChoiceField(choices=Appointment.Mode.choices, required=False)


class AppointmentSerializer(serializers.ModelSerializer):
    doctor_email = serializers.EmailField(source="doctor.user.email", read_only=True)

    class Meta:
        model = Appointment
        fields = ["id", "doctor", "doctor_email", "title", "starts_at", "ends_at", "mode", "status"]


class DoctorAppointmentSerializer(serializers.ModelSerializer):
    """Vue médecin : indique de quel patient il s'agit (pour ouvrir son dossier)."""

    patient_id = serializers.IntegerField(source="patient.pk", read_only=True)
    patient_pseudonym = serializers.CharField(source="patient.pseudonym", read_only=True)
    patient_email = serializers.EmailField(source="patient.user.email", read_only=True)

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
        ]
