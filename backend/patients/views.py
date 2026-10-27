from rest_framework.generics import RetrieveAPIView, UpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from audit_logs.mixins import SensitiveObjectAuditMixin
from patients.models import PatientProfile
from patients.permissions import IsNotAdminClinicalWrite, IsPatientSelfOrAssignedDoctor
from patients.serializers import PatientClinicalUpdateSerializer, PatientProfileSerializer
from rest_framework import permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.views import APIView

from accounts.permissions import IsPatient
from audit_logs.services import create_audit_entry
from patients.serializers import MRIScanSerializer
from patients.ai_client import AIServiceError, predict_mri
from patients.models import MRIScan, PatientProfile

class PatientProfileDetailView(SensitiveObjectAuditMixin, RetrieveAPIView):
    queryset = PatientProfile.objects.select_related("user")
    serializer_class = PatientProfileSerializer
    permission_classes = [IsAuthenticated, IsPatientSelfOrAssignedDoctor]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        self.log_sensitive_access(request, instance)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class PatientClinicalUpdateView(UpdateAPIView):
    queryset = PatientProfile.objects.select_related("user")
    serializer_class = PatientClinicalUpdateSerializer
    permission_classes = [IsAuthenticated, IsNotAdminClinicalWrite, IsPatientSelfOrAssignedDoctor]


class MRIScanListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsPatient]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        profile = getattr(request.user, "patient_profile", None)
        if profile is None:
            return Response({"detail": "Patient profile not found"}, status=status.HTTP_404_NOT_FOUND)
        scans = profile.mri_scans.all()
        serializer = MRIScanSerializer(scans, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        profile = getattr(request.user, "patient_profile", None)
        if profile is None:
            return Response({"detail": "Patient profile not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = MRIScanSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        scan = serializer.save(patient=profile)

        create_audit_entry(
            user=request.user,
            action="mri_uploaded",
            target_model="MRIScan",
            target_object_id=scan.pk,
            path=request.path,
            method=request.method,
            metadata={"patient_profile_id": profile.pk},
        )
        scan.status = MRIScan.Status.ANALYZING
        scan.save(update_fields=["status"])
        try:
            result = predict_mri(scan)
            scan.risk_score = result["risk_score"]
            scan.confidence = result.get("confidence")
            scan.model_version = result.get("model_version", "")
            scan.simulated = result.get("simulated", False)
            scan.status = MRIScan.Status.DONE
        except (AIServiceError, KeyError):
            scan.status = MRIScan.Status.FAILED
        scan.save()

        return Response(MRIScanSerializer(scan, context={"request": request}).data, status=status.HTTP_201_CREATED)