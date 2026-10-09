from django.urls import path
from dashboards.views import DoctorDashboardView, PatientDashboardView

urlpatterns = [
    path("patient/", PatientDashboardView.as_view(), name="dashboard-patient"),
    path("doctor/", DoctorDashboardView.as_view(), name="dashboard-doctor"),
]