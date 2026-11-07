from django.urls import path

from patients.views import (
    DoctorDirectoryView,
    DoctorPatientListView,
    DoctorPatientScansView,
    MRIScanAnalyzeView,
    MRIScanListCreateView,
    MyDoctorsView,
    PatientClinicalUpdateView,
    PatientProfileDetailView,
)

urlpatterns = [
    path("me/mri-scans/", MRIScanListCreateView.as_view(), name="mri-scans"),
    path("me/doctors/", MyDoctorsView.as_view(), name="my-doctors"),
    path("doctors/", DoctorDirectoryView.as_view(), name="doctor-directory"),
    path("doctor/patients/", DoctorPatientListView.as_view(), name="doctor-patients"),
    path("mri-scans/<int:scan_id>/analyze/", MRIScanAnalyzeView.as_view(), name="mri-analyze"),
    path("<int:pk>/mri-scans/", DoctorPatientScansView.as_view(), name="doctor-patient-scans"),
    path("<int:pk>/clinical/", PatientClinicalUpdateView.as_view(), name="patient-clinical"),
    path("<int:pk>/", PatientProfileDetailView.as_view(), name="patient-detail"),
]