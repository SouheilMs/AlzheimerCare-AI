from datetime import timedelta

from django.conf import settings
from livekit import api


def join_window(appointment):
    """Fenêtre pendant laquelle on peut entrer dans la salle."""
    before = timedelta(minutes=getattr(settings, "CONSULTATION_JOIN_MINUTES_BEFORE", 15))
    after = timedelta(minutes=getattr(settings, "CONSULTATION_JOIN_MINUTES_AFTER", 15))
    return appointment.starts_at - before, appointment.ends_at + after


def build_token(*, identity: str, name: str, room_name: str, ttl_minutes: int = 90) -> str:
    """Jeton LiveKit signé côté serveur : seul ce jeton ouvre la salle."""
    return (
        api.AccessToken(settings.LIVEKIT_API_KEY, settings.LIVEKIT_API_SECRET)
        .with_identity(identity)
        .with_name(name)
        .with_ttl(timedelta(minutes=ttl_minutes))
        .with_grants(
            api.VideoGrants(room_join=True, room=room_name, can_publish=True, can_subscribe=True)
        )
        .to_jwt()
    )
