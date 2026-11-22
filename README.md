# vn-consultancy

VN Group study-abroad site: FastAPI + PostgreSQL API (`app/`) and React/Vite frontend (`vn-frontend/`).
Architecture notes: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Deployment (Render + Neon)

`render.yaml` defines both services; see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for every setting.

1. Render → New → Blueprint → this repo. Fill in `DATABASE_URL` (pooled), `DATABASE_URL_UNPOOLED` (direct), `BANK_DATA_ENCRYPTION_KEY`, `BREVO_API_KEY` and `STAFF_EMAILS`.
2. The API runs `alembic upgrade head` on every start.
3. Free-tier uploads are stored on ephemeral disk and disappear when the service restarts.
