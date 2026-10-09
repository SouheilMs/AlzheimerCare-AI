from rest_framework.generics import RetrieveAPIView, UpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from audit_logs.mixins import SensitiveObjectAuditMixin
from patients.models import PatientProfile
from patients.permissions import IsNotAdminClinicalWrite, IsPatientSelfOrAssignedDoctor
from patients.serializers import PatientClinicalUpdateSerializer, PatientProfileSerializer


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
