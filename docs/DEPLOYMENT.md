# Deployment (Render + Neon)

`render.yaml` is the source of truth. This page explains the settings, the variables to enter by hand, and the known gaps.

## Services

| Service | Type | Build | Start | Notes |
|---|---|---|---|---|
| `vn-group-api` | Docker web service (`./Dockerfile`, Python 3.11) | image build installs `requirements.txt` | `alembic upgrade head && uvicorn app.main:app` | Health check: `GET /health`. Migrations run on every start, so every API deploy is a live migration. |
| `vn-group-demo` | Static site, `rootDir: vn-frontend` | `npm ci && npm run build` | n/a (publishes `dist`) | `NODE_VERSION=22`. Calls the API directly at `api.myvngroup.com` (same site, so auth cookies stay first-party). |

Python is pinned by the Docker base image (`python:3.11-slim`, `.python-version` = 3.11) and Node by `NODE_VERSION` / `vn-frontend/.node-version`.

## Environment variables for the API

Set by `render.yaml` (no action): `ENVIRONMENT=production`, `COOKIE_SECURE=true`, `CORS_ORIGINS`, `FRONTEND_URL`, `STORAGE_BACKEND`, `EMAIL_ENABLED`, `EMAIL_FROM_NAME`, `EMAIL_FROM_ADDRESS`, `SECRET_KEY` (generated).

Enter in the Render dashboard (`sync: false`): `DATABASE_URL` (Neon pooled), `DATABASE_URL_UNPOOLED` (Neon direct, used by migrations), `BANK_DATA_ENCRYPTION_KEY` (Fernet key, back it up), `BREVO_API_KEY`, `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `STAFF_EMAILS`.

Email is sent through Brevo's transactional HTTPS API (Render's free plan blocks SMTP). Startup refuses to run in production unless `EMAIL_ENABLED=true`, `BREVO_API_KEY`, `EMAIL_FROM_NAME` and `EMAIL_FROM_ADDRESS` are set. Optional tuning: `LOGIN_MAX_FAILURES`, `LOGIN_LOCKOUT_MINUTES`, `MAX_UPLOAD_MB`, `OTP_EXPIRE_MINUTES`.

The frontend needs `VITE_API_URL` (`https://api.myvngroup.com`) at build time. Leave `API_PATH_PREFIX` unset: the API is called on its own host, so the refresh cookie path is `/auth`.

## Rate limits behind Render

Per-IP limits count requests per visitor address. Measured on the live service on 19 Nov 2026: Render puts Cloudflare in front of the API, and Cloudflare sets `CF-Connecting-IP` to the visitor's real address, identical through the static site and when calling the API directly. `X-Forwarded-For` starts with whatever the visitor sends, so it is not trusted: the Dockerfile runs uvicorn with `--no-proxy-headers`, and `app/core/client_ip.py` reads `CF-Connecting-IP` (setting `CLIENT_IP_HEADER`), falling back to the socket address when the header is missing or not an IP (local development, Render's health check).

If the API is ever reachable without Cloudflare in front (another host, a private network), set `CLIENT_IP_HEADER` to an empty value, otherwise a client could forge the header. The per-email sign-in limit does not depend on any of this.

## Uploads (Cloudflare R2)

Documents, profile photos and gallery images are stored in a **private** Cloudflare R2 bucket, so they survive deploys and restarts. R2 encrypts objects at rest. The bucket has no public URL: every download goes through the API, which checks who is asking and writes the audit log, then streams the file from R2. In production the API refuses to start unless `STORAGE_BACKEND=r2` and the four `R2_*` values are set. Development and tests use `STORAGE_BACKEND=local` (files under `UPLOAD_DIR`).

One-time setup:

1. Cloudflare dashboard, R2: create a bucket (for example `vn-uploads`). Leave public access off and do not attach a custom domain.
2. R2, Manage API tokens: create a token with **Object Read & Write** limited to that bucket. Copy the Access Key ID and Secret Access Key (shown once).
3. On `vn-group-api`, set `R2_ACCOUNT_ID` (R2 overview page), `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`. `STORAGE_BACKEND=r2` comes from `render.yaml`.
4. Deploy, then upload a document and a profile photo, redeploy the API, and confirm both still open.

Files written before the switch lived on the instance disk and were lost on each deploy, so there is nothing to migrate. Back up the bucket by enabling R2 object versioning or copying it with `rclone` on a schedule. Rotating the token: create a new one, update both secrets in Render, then delete the old token.

## Release and rollback

Render deploys the branch set in the dashboard. Merge to that branch to deploy; the API applies new migrations on start. To roll back code use Render's "Rollback"; migrations are not undone automatically (`alembic downgrade <revision>` against the direct Neon URL, after checking the downgrade is safe).
