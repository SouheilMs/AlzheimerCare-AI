from rest_framework import serializers

from patients.models import PatientProfile
from django.conf import settings

from patients.models import MRIScan

class PatientProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = PatientProfile
        fields = ["id", "user_email", "pseudonym", "birth_date"]


class PatientClinicalUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientProfile
        fields = ["birth_date"]


class MRIScanSerializer(serializers.ModelSerializer):
    class Meta:
        model = MRIScan
        fields = ["id", "file", "uploaded_at", "status"]
        read_only_fields = ["id", "uploaded_at", "status"]

    def validate_file(self, value):
        name = value.name.lower()
        allowed = settings.MRI_ALLOWED_EXTENSIONS
        if not any(name.endswith(ext) for ext in allowed):
            raise serializers.ValidationError(
                "Format non accepté. Formats autorisés : " + ", ".join(allowed)
            )

        max_bytes = settings.MRI_MAX_UPLOAD_MB * 1024 * 1024
        if value.size > max_bytes:
            raise serializers.ValidationError(
                f"Fichier trop volumineux (maximum {settings.MRI_MAX_UPLOAD_MB} Mo)."
            )

        return value