from django.urls import path

from appointments.views import (
    AppointmentCancelView,
    AppointmentListCreateView,
    DoctorAppointmentListView,
    InternalSendRemindersView,
    SuggestedSlotsView,
)

urlpatterns = [
    path("", AppointmentListCreateView.as_view(), name="appointments"),
    path("suggested-slots/", SuggestedSlotsView.as_view(), name="appointment-suggested-slots"),
    path("doctor/", DoctorAppointmentListView.as_view(), name="appointments-doctor"),
    path("internal/send-reminders/", InternalSendRemindersView.as_view(), name="appointments-send-reminders"),
    path("<int:pk>/cancel/", AppointmentCancelView.as_view(), name="appointment-cancel"),
]
