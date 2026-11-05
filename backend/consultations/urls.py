from django.urls import path

from consultations.views import AgentSegmentView, EndConsultationView, JoinConsultationView, ConsultationReportView, PatientConsultationsView
urlpatterns = [
    path("<int:appointment_id>/join/", JoinConsultationView.as_view(), name="consultation-join"),
    path("<int:appointment_id>/end/", EndConsultationView.as_view(), name="consultation-end"),
    path("internal/segments/", AgentSegmentView.as_view(), name="consultation-agent-segment"),
    path("<int:appointment_id>/report/", ConsultationReportView.as_view(), name="consultation-report"),
    path("patient/<int:patient_id>/", PatientConsultationsView.as_view(), name="consultation-patient-list"),
]
