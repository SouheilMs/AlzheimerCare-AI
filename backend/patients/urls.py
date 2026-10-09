from django.urls import path

from patients.views import PatientClinicalUpdateView, PatientProfileDetailView

urlpatterns = [
    path("<int:pk>/", PatientProfileDetailView.as_view(), name="patient-detail"),
    path("<int:pk>/clinical/", PatientClinicalUpdateView.as_view(), name="patient-clinical-update"),
]
