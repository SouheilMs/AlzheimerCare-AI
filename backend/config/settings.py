from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "change-me")
DEBUG = os.getenv("DJANGO_DEBUG", "False").lower() == "true"
ALLOWED_HOSTS = [host.strip() for host in os.getenv("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if host.strip()]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "accounts",
    "patients",
    "doctors",
    "audit_logs",
    "dashboards",
    "reports",
    "games",
    "cognitive_tests",
    "appointments",
    "notifications",
    "predictions",
    "consultations",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "audit_logs.middleware.SensitiveAccessAuditMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("POSTGRES_DB", "alzheimercare"),
        "USER": os.getenv("POSTGRES_USER", "alzheimercare"),
        "PASSWORD": os.getenv("POSTGRES_PASSWORD", "alzheimercare"),
        "HOST": os.getenv("POSTGRES_HOST", "localhost"),
        "PORT": os.getenv("POSTGRES_PORT", "5432"),
    }
}

if os.getenv("USE_SQLITE_FOR_TESTS", "False").lower() == "true":
    DATABASES["default"] = {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
MRI_ALLOWED_EXTENSIONS = [".zip"]
MRI_MAX_UPLOAD_MB = 100
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://ai-service:8001")
AI_SERVICE_TIMEOUT = int(os.getenv("AI_SERVICE_TIMEOUT", "60"))
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

MRI_HIGH_RISK_THRESHOLD = float(os.getenv("MRI_HIGH_RISK_THRESHOLD", "0.6"))
APPOINTMENT_TIMEZONE = "Africa/Tunis"
APPOINTMENT_WORK_START_HOUR = 9
APPOINTMENT_WORK_END_HOUR = 17
APPOINTMENT_SLOT_MINUTES = 30
APPOINTMENT_DAYS_AHEAD = 14

AUTH_USER_MODEL = "accounts.User"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "accounts.authentication.KeycloakAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.ScopedRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "anon": "60/minute",
        "user": "120/minute",
        "auth": "20/minute",
    },
}

EMAIL_BACKEND = os.getenv("EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend")
EMAIL_HOST = os.getenv("EMAIL_HOST", "localhost")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "1025"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "False").lower() == "true"
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "AlzheimerCare AI <no-reply@alzheimercare.local>")
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173").rstrip("/")
FRONTEND_PASSWORD_RESET_URL = os.getenv("FRONTEND_PASSWORD_RESET_URL", "http://localhost:5173/reset-password")

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("DJANGO_CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]
CORS_ALLOW_CREDENTIALS = False

KEYCLOAK_SERVER_URL = os.getenv("KEYCLOAK_SERVER_URL", "http://localhost:8080").rstrip("/")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM", "alzheimercare")
KEYCLOAK_FRONTEND_CLIENT_ID = os.getenv("KEYCLOAK_FRONTEND_CLIENT_ID", "alzheimercare-frontend")
KEYCLOAK_BACKEND_CLIENT_ID = os.getenv("KEYCLOAK_BACKEND_CLIENT_ID", "alzheimercare-backend")
KEYCLOAK_BACKEND_CLIENT_SECRET = os.getenv("KEYCLOAK_BACKEND_CLIENT_SECRET", "")
KEYCLOAK_EXPECTED_ISSUER = os.getenv(
    "KEYCLOAK_EXPECTED_ISSUER",
    f"{KEYCLOAK_SERVER_URL}/realms/{KEYCLOAK_REALM}",
)
KEYCLOAK_TOKEN_AUDIENCE = os.getenv("KEYCLOAK_TOKEN_AUDIENCE", KEYCLOAK_FRONTEND_CLIENT_ID)
KEYCLOAK_INTERNAL_URL = os.getenv("KEYCLOAK_INTERNAL_URL", KEYCLOAK_SERVER_URL).rstrip("/")
KEYCLOAK_JWKS_URL = f"{KEYCLOAK_INTERNAL_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/certs"
KEYCLOAK_JWKS_CACHE_TTL = int(os.getenv("KEYCLOAK_JWKS_CACHE_TTL", "300"))
KEYCLOAK_CLOCK_SKEW_SECONDS = int(os.getenv("KEYCLOAK_CLOCK_SKEW_SECONDS", "30"))
LIVEKIT_URL = os.environ["LIVEKIT_URL"]
LIVEKIT_API_KEY = os.environ["LIVEKIT_API_KEY"]
LIVEKIT_API_SECRET = os.environ["LIVEKIT_API_SECRET"]
CONSULTATION_JOIN_MINUTES_BEFORE = 15
CONSULTATION_JOIN_MINUTES_AFTER = 15
AGENT_SHARED_SECRET = os.getenv("AGENT_SHARED_SECRET", "")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://host.docker.internal:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")