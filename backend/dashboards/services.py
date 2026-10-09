from __future__ import annotations
from datetime import date
from typing import Any
from django.db.models import Avg, OuterRef, QuerySet, Subquery
from django.db.models.functions import TruncMonth
from django.utils import timezone
from appointments.models import Appointment
from cognitive_tests.models import CognitiveTest
from doctors.models import DoctorProfile
from games.models import Game
from notifications.models import Notification
from patients.models import PatientProfile
from predictions.models import Alert, Prediction
from reports.models import MedicalReport

FR_MONTHS = ["Janv", "Fév", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"]
RISK_BY_STATE = {
    Prediction.State.STABLE: "low",
    Prediction.State.TO_MONITOR: "moderate",
    Prediction.State.LIKELY_PROGRESSION: "high",
}
ATTENTION_ORDER = {"high": 0, "moderate": 1}

def _display_name(user, fallback: str | None = None) -> str:
    return f"{user.first_name} {user.last_name}".strip() or fallback or user.email

def _month_start(months_back: int):
    now = timezone.localtime()
    index = now.year * 12 + now.month - 1 - months_back
    return now.replace(year=index // 12, month=index % 12 + 1, day=1, hour=0, minute=0, second=0, microsecond=0)

def _age(birth_date: date | None) -> int | None:
    if not birth_date:
        return None
    today = date.today()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))

def score_evolution(tests: QuerySet[CognitiveTest], months: int = 6) -> list[dict[str, Any]]:
    rows = (
        tests.filter(taken_at__gte=_month_start(months - 1))
        .annotate(month=TruncMonth("taken_at"))
        .values("month", "test_type")
        .annotate(avg=Avg("score"))
        .order_by("month")
    )
    by_month: dict[Any, dict[str, int]] = {}
    for row in rows:
        by_month.setdefault(row["month"], {})[row["test_type"]] = round(row["avg"])
    return [
        {
            "month": FR_MONTHS[month.month - 1],
            "memory": values.get("memory"),
            "attention": values.get("attention"),
            "regularity": values.get("regularity"),
        }
        for month, values in by_month.items()
    ]

def _follow_up_status(evolution: list[dict[str, Any]]) -> dict[str, str]:
    # Engagement wording only, never a diagnosis (rule 7).
    start = {"label": "Démarrage", "detail": "Vos résultats apparaîtront ici après quelques activités."}
    if len(evolution) < 2:
        return start

    def mean(point: dict[str, Any]) -> float | None:
        vals = [point[k] for k in ("memory", "attention", "regularity") if point[k] is not None]
        return sum(vals) / len(vals) if vals else None

    previous, last = mean(evolution[-2]), mean(evolution[-1])
    if previous is None or last is None:
        return start
    if last > previous + 2:
        return {"label": "En progression", "detail": "Vos résultats évoluent positivement ce mois-ci. Continuez !"}
    if last < previous - 2:
        return {"label": "À suivre", "detail": "Vos résultats ont un peu varié ce mois-ci. Votre médecin pourra en discuter avec vous."}
    return {"label": "Stable", "detail": "Vos résultats de suivi sont globalement stables ce dernier mois. Continuez vos activités !"}

def _next_activity(patient: PatientProfile) -> dict[str, str]:
    if not CognitiveTest.objects.filter(patient=patient, taken_at__gte=_month_start(0)).exists():
        return {"title": "Compléter le questionnaire du mois", "description": "Quelques minutes pour suivre votre évolution."}
    game = Game.objects.filter(is_active=True).first()
    if game:
        return {"title": f"Jouer à {game.name}", "description": f"{game.duration_minutes} min • {game.level}"}
    return {"title": "Vous êtes à jour", "description": "Aucune activité prévue pour le moment."}

def _appointment(a: Appointment) -> dict[str, Any]:
    start, end = timezone.localtime(a.starts_at), timezone.localtime(a.ends_at)
    payload: dict[str, Any] = {
        "id": str(a.pk),
        "title": a.title,
        "clinician": _display_name(a.doctor.user),
        "date": start.date().isoformat(),
        "startTime": start.strftime("%H:%M"),
        "endTime": end.strftime("%H:%M"),
        "mode": a.mode,
    }
    if a.notes:
        payload["notes"] = a.notes
    return payload

def patient_dashboard(patient: PatientProfile) -> dict[str, Any]:
    evolution = score_evolution(CognitiveTest.objects.filter(patient=patient))
    appointments = (
        Appointment.objects.filter(patient=patient, status=Appointment.Status.SCHEDULED, starts_at__gte=timezone.now())
        .select_related("doctor__user")[:5]
    )
    return {
        "followUpStatus": _follow_up_status(evolution),
        "nextActivity": _next_activity(patient),
        "cognitiveGames": [
            {"id": str(g.pk), "name": g.name, "duration": f"{g.duration_minutes} min", "level": g.level}
            for g in Game.objects.filter(is_active=True)
        ],
        "appointments": [_appointment(a) for a in appointments],
        "notifications": list(
            Notification.objects.filter(user=patient.user).values_list("message", flat=True)[:5]
        ),
        "scoreEvolution": evolution,
    }

def doctor_dashboard(doctor: DoctorProfile) -> dict[str, Any]:
    now = timezone.now()
    today = timezone.localdate()
    assigned = PatientProfile.objects.filter(assignments__doctor=doctor)

    latest_pred = Prediction.objects.filter(patient=OuterRef("pk")).order_by("-created_at")
    last_visit = Appointment.objects.filter(
        patient=OuterRef("pk"), doctor=doctor, status=Appointment.Status.COMPLETED
    ).order_by("-starts_at")
    latest_alert = Alert.objects.filter(patient=OuterRef("pk")).order_by("-created_at")
    annotated = assigned.select_related("user").annotate(
        latest_state=Subquery(latest_pred.values("state")[:1]),
        last_visit=Subquery(last_visit.values("starts_at")[:1]),
        latest_reason=Subquery(latest_alert.values("summary")[:1]),
    )

    attention = sorted(
        (p for p in annotated if RISK_BY_STATE.get(p.latest_state) in ATTENTION_ORDER),
        key=lambda p: ATTENTION_ORDER[RISK_BY_STATE[p.latest_state]],
    )[:10]

    open_alerts = Alert.objects.filter(patient__in=assigned, acknowledged_at__isnull=True)
    todays = list(
        Appointment.objects.filter(
            doctor=doctor, patient__in=assigned, status=Appointment.Status.SCHEDULED, starts_at__date=today
        ).select_related("patient__user")
    )
    pending_reports = MedicalReport.objects.filter(
        patient__in=assigned, status=MedicalReport.Status.AWAITING_VALIDATION
    ).select_related("patient__user")
    oldest = pending_reports.order_by("created_at").first()

    quick = (
        Prediction.objects.filter(patient__in=assigned)
        .exclude(state=Prediction.State.INSUFFICIENT_DATA)
        .first()
    )

    return {
        "metrics": [
            {"id": "patients", "label": "Patients suivis", "value": str(assigned.count()),
             "change": f"+{doctor.assignments.filter(assigned_at__gte=_month_start(0)).count()} ce mois"},
            {"id": "consultations", "label": "Consultations aujourd’hui", "value": str(len(todays)),
             "change": f"{sum(1 for a in todays if a.starts_at >= now)} à venir"},
            {"id": "alerts", "label": "Alertes IA", "value": str(open_alerts.count()),
             "change": f"{open_alerts.filter(created_at__gte=now - timezone.timedelta(hours=24)).count()} dans les dernières 24 h"},
            {"id": "reports", "label": "Rapports à valider", "value": str(pending_reports.count()),
             "change": f"En attente depuis {(now - oldest.created_at).days} j" if oldest else "Aucun en attente"},
        ],
        "patientsNeedingAttention": [
            {
                "id": str(p.pk),
                "fullName": _display_name(p.user, fallback=p.pseudonym),
                "age": _age(p.birth_date),
                "identifier": p.pseudonym,
                "riskState": RISK_BY_STATE[p.latest_state],
                "lastConsultationDate": p.last_visit.date().isoformat() if p.last_visit else None,
                "reason": p.latest_reason or "",
            }
            for p in attention
        ],
        "alerts": [
            {
                "id": str(a.pk),
                "patientId": str(a.patient_id),
                "patientName": _display_name(a.patient.user, fallback=a.patient.pseudonym),
                "severity": a.severity,
                "summary": a.summary,
                "createdAt": a.created_at.isoformat(),
                "requiresValidation": True,
            }
            for a in open_alerts.select_related("patient__user")[:10]
        ],
        "consultations": [
            {
                "id": str(a.pk),
                "patientId": str(a.patient_id),
                "patientName": _display_name(a.patient.user, fallback=a.patient.pseudonym),
                "date": timezone.localtime(a.starts_at).date().isoformat(),
                "startTime": timezone.localtime(a.starts_at).strftime("%H:%M"),
                "durationMinutes": int((a.ends_at - a.starts_at).total_seconds() // 60),
                "modality": a.mode,
                "purpose": a.title,
            }
            for a in todays
        ],
        "reports": [
            {
                "id": str(r.pk),
                "patientId": str(r.patient_id),
                "patientName": _display_name(r.patient.user, fallback=r.patient.pseudonym),
                "createdAt": r.created_at.isoformat(),
                "status": r.status,
                "requiresValidation": True,
            }
            for r in pending_reports[:10]
        ],
        "quickPrediction": None if quick is None else {
            "id": str(quick.pk),
            "patientId": str(quick.patient_id),
            "state": RISK_BY_STATE[quick.state],
            "risk_score": quick.risk_score,
            "confidence": quick.confidence,
            "model_version": quick.model_version,
            "horizon": f"{quick.horizon_months} mois",
            "summary": quick.summary,
            "requiresValidation": True,
        },
        "scoreEvolution": score_evolution(CognitiveTest.objects.filter(patient__in=assigned)),
    }