from django.urls import path

from appointments.views import AppointmentListCreateView, SuggestedSlotsView

urlpatterns = [
    path("", AppointmentListCreateView.as_view(), name="appointments"),
    path("suggested-slots/", SuggestedSlotsView.as_view(), name="appointment-suggested-slots"),
]