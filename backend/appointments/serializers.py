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