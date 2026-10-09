# Keycloak local realm setup

The `realm-export.json` file contains the local development realm for AlzheimerCare AI.

## Import on startup

The docker-compose service mounts the export file to:

`/opt/keycloak/data/import/realm-export.json`

and starts Keycloak with `start-dev --import-realm`.

## Re-export workflow

1. Start stack and sign in to Keycloak admin console (`http://localhost:8080/admin`).
2. Select realm `alzheimercare`.
3. Go to **Realm settings -> Action -> Partial export**.
4. Export clients, roles, groups, and users for local dev.
5. Replace secrets from exported JSON with placeholders before committing.
6. Save the sanitized JSON back to `infra/keycloak/realm-export.json`.

## Dev-only users

`realm-export.json` intentionally contains 3 dev-only users:

- `dev-patient@alzheimercare.local` (`patient`)
- `dev-doctor@alzheimercare.local` (`doctor`)
- `dev-admin@alzheimercare.local` (`admin`)

Do not use these in production.
