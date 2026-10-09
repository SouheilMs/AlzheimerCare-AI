from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from accounts.permissions import IsDoctor, IsPatient
from audit_logs.services import create_audit_entry
from dashboards.services import doctor_dashboard, patient_dashboard
from doctors.models import DoctorProfile
from patients.models import PatientProfile

class PatientDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsPatient]

    def get(self, request):
        profile = PatientProfile.objects.filter(user=request.user).first()
        if profile is None:
            raise NotFound("Patient profile not found.")
        create_audit_entry(user=request.user, action="sensitive_read", target_model="PatientDashboard",
                           target_object_id=profile.pk, path=request.path, method=request.method)
        return Response(patient_dashboard(profile))

class DoctorDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    def get(self, request):
        profile = DoctorProfile.objects.filter(user=request.user).first()
        if profile is None:
            raise NotFound("Doctor profile not found.")
        create_audit_entry(user=request.user, action="sensitive_read", target_model="DoctorDashboard",
                           target_object_id=profile.pk, path=request.path, method=request.method)
        return Response(doctor_dashboard(profile))