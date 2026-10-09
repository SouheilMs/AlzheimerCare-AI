from rest_framework import serializers

from patients.models import PatientProfile


class PatientProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = PatientProfile
        fields = ["id", "user_email", "pseudonym", "birth_date"]


class PatientClinicalUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientProfile
        fields = ["birth_date"]
