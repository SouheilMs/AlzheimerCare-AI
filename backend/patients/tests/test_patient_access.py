import pytest
from rest_framework.test import APIClient

from accounts.models import User, UserRole
from doctors.models import DoctorProfile
from patients.models import DoctorPatientAssignment, PatientProfile


@pytest.mark.django_db
def test_patient_cannot_read_another_patient_data():
    patient_user_1 = User.objects.create_user("patient1@example.com", "Testpass123!", role=UserRole.PATIENT)
    patient_user_2 = User.objects.create_user("patient2@example.com", "Testpass123!", role=UserRole.PATIENT)
    PatientProfile.objects.create(user=patient_user_1, pseudonym="patient-1")
    patient_2_profile = PatientProfile.objects.create(user=patient_user_2, pseudonym="patient-2")

    client = APIClient()
    client.force_authenticate(user=patient_user_1)

    response = client.get(f"/api/patients/{patient_2_profile.id}/")

    assert response.status_code == 403


@pytest.mark.django_db
def test_doctor_cannot_read_unassigned_patient_data():
    doctor_user = User.objects.create_user("doctor@example.com", "Testpass123!", role=UserRole.DOCTOR)
    unassigned_patient_user = User.objects.create_user("patient@example.com", "Testpass123!", role=UserRole.PATIENT)
    assigned_patient_user = User.objects.create_user("patient2@example.com", "Testpass123!", role=UserRole.PATIENT)

    doctor_profile = DoctorProfile.objects.create(user=doctor_user, license_number="LIC-001")
    assigned_patient_profile = PatientProfile.objects.create(user=assigned_patient_user, pseudonym="assigned-patient")
    unassigned_patient_profile = PatientProfile.objects.create(user=unassigned_patient_user, pseudonym="unassigned-patient")

    DoctorPatientAssignment.objects.create(doctor=doctor_profile, patient=assigned_patient_profile)

    client = APIClient()
    client.force_authenticate(user=doctor_user)

    response = client.get(f"/api/patients/{unassigned_patient_profile.id}/")

    assert response.status_code == 403


@pytest.mark.django_db
def test_admin_cannot_edit_clinical_data():
    admin_user = User.objects.create_user("admin@example.com", "Testpass123!", role=UserRole.ADMIN)
    patient_user = User.objects.create_user("patient@example.com", "Testpass123!", role=UserRole.PATIENT)
    patient_profile = PatientProfile.objects.create(user=patient_user, pseudonym="patient-to-edit")

    client = APIClient()
    client.force_authenticate(user=admin_user)

    response = client.patch(
        f"/api/patients/{patient_profile.id}/clinical/",
        {"birth_date": "2000-01-01"},
        format="json",
    )

    assert response.status_code == 403
