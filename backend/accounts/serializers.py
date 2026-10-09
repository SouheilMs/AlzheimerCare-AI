from django.contrib.auth import get_user_model
from rest_framework import serializers

from accounts.models import UserRole

User = get_user_model()


class AuthMeSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "role", "profile"]

    def get_profile(self, obj):
        if obj.role == UserRole.PATIENT and hasattr(obj, "patient_profile"):
            return {
                "patient_profile_id": obj.patient_profile.id,
                "pseudonym": obj.patient_profile.pseudonym,
            }
        if obj.role == UserRole.DOCTOR and hasattr(obj, "doctor_profile"):
            return {
                "doctor_profile_id": obj.doctor_profile.id,
                "license_number": obj.doctor_profile.license_number,
                "specialty": obj.doctor_profile.specialty,
            }
        return {}


class AdminCreateUserSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=[UserRole.PATIENT, UserRole.DOCTOR])
    temporary_password = serializers.CharField(required=False, write_only=True, min_length=12)


class AdminChangeRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=[UserRole.PATIENT, UserRole.DOCTOR])


class AdminToggleUserSerializer(serializers.Serializer):
    enabled = serializers.BooleanField()
