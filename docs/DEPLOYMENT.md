# Deployment (Render + Neon)

`render.yaml` is the source of truth. This page explains the settings, the variables to enter by hand, and the known gaps.

## Services

| Service | Type | Build | Start | Notes |
|---|---|---|---|---|
| `vn-group-api` | Docker web service (`./Dockerfile`, Python 3.11) | image build installs `requirements.txt` | `alembic upgrade head && uvicorn app.main:app` | Health check: `GET /health`. Migrations run on every start, so every API deploy is a live migration. |
| `vn-group-demo` | Static site, `rootDir: vn-frontend` | `npm ci && npm run build` | n/a (publishes `dist`) | `NODE_VERSION=22`. Rewrites `/api/*` to the API service so auth cookies stay first-party. |

Python is pinned by the Docker base image (`python:3.11-slim`, `.python-version` = 3.11) and Node by `NODE_VERSION` / `vn-frontend/.node-version`.

## Environment variables for the API

Set by `render.yaml` (no action): `ENVIRONMENT=production`, `COOKIE_SECURE=true`, `API_PATH_PREFIX=/api`, `CORS_ORIGINS`, `FRONTEND_URL`, `UPLOAD_DIR`, `EMAIL_ENABLED`, `DEMO_MODE`, `SECRET_KEY` (generated).

Enter in the Render dashboard (`sync: false`): `DATABASE_URL` (Neon pooled), `DATABASE_URL_UNPOOLED` (Neon direct, used by migrations), `BANK_DATA_ENCRYPTION_KEY` (Fernet key, back it up), `STAFF_EMAILS`.

For a real (non-demo) launch also set: `DEMO_MODE=false`, `EMAIL_ENABLED=true`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`. Startup refuses to run in production without them. Optional tuning: `LOGIN_MAX_FAILURES`, `LOGIN_LOCKOUT_MINUTES`, `MAX_UPLOAD_MB`, `OTP_EXPIRE_MINUTES`.

`DEBUG_CLIENT_IP_HEADERS=true` is a temporary diagnostic (see "Rate limits behind Render"). Leave it unset.

The frontend needs `VITE_API_URL` (`/api`) at build time.

## Rate limits behind Render

The API's per-IP limits depend on knowing the visitor's real IP. The Dockerfile currently trusts every `X-Forwarded-For` value, which a client can forge, so IP limits can be bypassed. The per-email sign-in limit does not depend on this. To choose the right setting:

1. Set `DEBUG_CLIENT_IP_HEADERS=true` on the API service and redeploy.
2. Call the API both through the site (`https://<site>/api/health`) and directly (`https://<api>.onrender.com/health`), once from your normal connection and once from a phone on mobile data.
3. Copy the `CLIENT-IP-DEBUG` lines from the Render log (they hold IP headers only, no cookies or bodies).
4. Set the variable back to `false`.

## Uploads (known gap)

Documents and photos are written to `UPLOAD_DIR` on the instance disk. On Render's free plan that disk is wiped on every deploy and restart, and files are stored unencrypted. Fine for the synthetic demo; **not acceptable for real student documents.** Options, in the order I would consider them:

1. **Render persistent disk** (paid plan, mounted at `/app/uploads`): smallest change, no code change; one instance only; back it up.
2. **S3-compatible object storage** (Cloudflare R2, AWS S3, Neon object storage): survives redeploys and scaling, supports server-side encryption and private signed downloads; needs a small storage layer in `app/utils/file_validation.py` and the download routes.
3. Keep the disk but encrypt files at rest (Fernet, as bank numbers already are): protects against disk exposure, but does not fix loss on redeploy.

## Release and rollback

Render deploys the branch set in the dashboard. Merge to that branch to deploy; the API applies new migrations on start. To roll back code use Render's "Rollback"; migrations are not undone automatically (`alembic downgrade <revision>` against the direct Neon URL, after checking the downgrade is safe).
