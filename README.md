# vn-consultancy

VN Group study-abroad site: FastAPI + PostgreSQL API (`app/`) and React/Vite frontend (`vn-frontend/`).
Architecture notes: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Public demo (Render + Neon)

`render.yaml` defines both services. The static frontend rewrites `/api/*` to the API, so auth cookies stay first-party.

1. Neon: use a **separate demo database** (synthetic data only), never the real one.
2. Render → New → Blueprint → this repo. Fill in `DATABASE_URL` (pooled), `DATABASE_URL_UNPOOLED` (direct) and `BANK_DATA_ENCRYPTION_KEY`.
3. The API runs `alembic upgrade head` on every start. Seed demo accounts once, against the demo database:
   `DEMO_MODE=true DEMO_SEED_PASSWORD=... python -m scripts.seed_demo`
4. If Render names the API something other than `vn-group-api.onrender.com`, update the `/api/*` rewrite in `render.yaml`.

`DEMO_MODE=true` lets production run without SMTP (Render's free tier blocks mail ports): OTP emails go to the private Render log.
Free-tier uploads are stored on ephemeral disk and disappear when the service restarts.
