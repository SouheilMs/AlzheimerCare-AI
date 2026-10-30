from django.conf import settings  # noqa: F401
from django.db.models import Count, Max, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.generics import RetrieveAPIView, UpdateAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsDoctor, IsPatient
from audit_logs.mixins import SensitiveObjectAuditMixin
from audit_logs.services import create_audit_entry
from doctors.models import DoctorProfile
from patients.ai_client import AIServiceError, predict_mri
from patients.models import MRIScan, PatientProfile
from patients.permissions import IsNotAdminClinicalWrite, IsPatientSelfOrAssignedDoctor
from patients.serializers import (
    MRIScanSerializer,
    PatientClinicalUpdateSerializer,
    PatientProfileSerializer,
)
from notifications.services import notify_doctors_new_mri

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
        scan = serializer.save(patient=profile)  # statut = pending
        notify_doctors_new_mri(scan)
        create_audit_entry(
            user=request.user,
            action="mri_uploaded",
            target_model="MRIScan",
            target_object_id=scan.pk,
            path=request.path,
            method=request.method,
            metadata={"patient_profile_id": profile.pk},
        )
        return Response(
            MRIScanSerializer(scan, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class DoctorPatientListView(APIView):
    """Cartes : les patients assignés au médecin connecté."""

    permission_classes = [permissions.IsAuthenticated, IsDoctor]

    def get(self, request):
        patients = (
            PatientProfile.objects.filter(assignments__doctor__user=request.user)
            .select_related("user")
            .annotate(
                scans_count=Count("mri_scans", distinct=True),
                pending_count=Count("mri_scans", filter=Q(mri_scans__status="pending"), distinct=True),
                last_upload=Max("mri_scans__uploaded_at"),
            )
        )
        data = []
        for p in patients:
            last_done = p.mri_scans.filter(status=MRIScan.Status.DONE).first()
            data.append(
                {
                    "id": p.pk,
                    "pseudonym": p.pseudonym,
                    "email": p.user.email,
                    "birth_date": p.birth_date,
                    "scans_count": p.scans_count,
                    "pending_count": p.pending_count,
                    "last_upload": p.last_upload,
                    "last_risk_score": last_done.risk_score if last_done else None,
                }
            )
        return Response(data)


class DoctorPatientScansView(APIView):
    """Les IRM d'un patient (uniquement s'il est assigné au médecin)."""

    permission_classes = [permissions.IsAuthenticated, IsDoctor]

    def get(self, request, pk):
        patient = get_object_or_404(PatientProfile, pk=pk, assignments__doctor__user=request.user)
        scans = patient.mri_scans.all()
        return Response(MRIScanSerializer(scans, many=True, context={"request": request}).data)


class MRIScanAnalyzeView(APIView):
    """Le médecin lance l'analyse deep learning d'une IRM."""

    permission_classes = [permissions.IsAuthenticated, IsDoctor]

    def post(self, request, scan_id):
        scan = get_object_or_404(
            MRIScan, pk=scan_id, patient__assignments__doctor__user=request.user
        )
        if scan.status == MRIScan.Status.ANALYZING:
            return Response({"detail": "Analyse déjà en cours."}, status=status.HTTP_409_CONFLICT)

        scan.status = MRIScan.Status.ANALYZING
        scan.save(update_fields=["status"])
        try:
            result = predict_mri(scan)
            scan.risk_score = result["risk_score"]
            scan.confidence = result.get("confidence")
            scan.model_version = result.get("model_version", "")
            scan.simulated = result.get("simulated", False)
            scan.status = MRIScan.Status.DONE
            scan.analyzed_by = DoctorProfile.objects.filter(user=request.user).first()
            scan.analyzed_at = timezone.now()
        except (AIServiceError, KeyError):
            scan.status = MRIScan.Status.FAILED
            scan.risk_score = None
            scan.confidence = None
            scan.model_version = ""
        scan.save()

        create_audit_entry(
            user=request.user,
            action="mri_analyzed",
            target_model="MRIScan",
            target_object_id=scan.pk,
            path=request.path,
            method=request.method,
            metadata={"status": scan.status},
        )
        return Response(MRIScanSerializer(scan, context={"request": request}).data)