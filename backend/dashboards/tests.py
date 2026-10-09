import pytest
from rest_framework.test import APIClient
from accounts.models import User, UserRole
from audit_logs.models import AuditLog
from doctors.models import DoctorProfile
from patients.models import DoctorPatientAssignment, PatientProfile
from predictions.models import Prediction

def _client(user):
    c = APIClient()
    c.force_authenticate(user=user)
    return c

@pytest.mark.django_db
def test_unauthenticated_gets_401():
    assert APIClient().get("/api/dashboard/patient/").status_code == 401

@pytest.mark.django_db
def test_wrong_role_gets_403():
    patient = User.objects.create_user("p@example.com", role=UserRole.PATIENT)
    admin = User.objects.create_user("a@example.com", role=UserRole.ADMIN)
    PatientProfile.objects.create(user=patient, pseudonym="p")
    assert _client(patient).get("/api/dashboard/doctor/").status_code == 403
    assert _client(admin).get("/api/dashboard/patient/").status_code == 403

@pytest.mark.django_db
def test_patient_dashboard_is_empty_but_valid_and_audited():
    user = User.objects.create_user("p@example.com", role=UserRole.PATIENT)
    PatientProfile.objects.create(user=user, pseudonym="p")
    res = _client(user).get("/api/dashboard/patient/")
    assert res.status_code == 200
    assert res.json()["scoreEvolution"] == []
    assert AuditLog.objects.filter(target_model="PatientDashboard").exists()

@pytest.mark.django_db
def test_doctor_sees_only_assigned_patients():
    doc_user = User.objects.create_user("d@example.com", role=UserRole.DOCTOR)
    doctor = DoctorProfile.objects.create(user=doc_user, license_number="L1")
    mine = PatientProfile.objects.create(user=User.objects.create_user("m@example.com", role=UserRole.PATIENT), pseudonym="mine")
    other = PatientProfile.objects.create(user=User.objects.create_user("o@example.com", role=UserRole.PATIENT), pseudonym="other")
    DoctorPatientAssignment.objects.create(doctor=doctor, patient=mine)
    for p in (mine, other):
        Prediction.objects.create(patient=p, state="likely_progression", risk_score=0.7, confidence=0.8, model_version="v1")

    body = _client(doc_user).get("/api/dashboard/doctor/").json()
    assert [p["identifier"] for p in body["patientsNeedingAttention"]] == ["mine"]
    assert body["quickPrediction"]["patientId"] == str(mine.pk)