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

The frontend needs `VITE_API_URL` (`/api`) at build time.

## Rate limits behind Render

Per-IP limits count requests per visitor address. Measured on the live service on 19 Nov 2026: Render puts Cloudflare in front of the API, and Cloudflare sets `CF-Connecting-IP` to the visitor's real address, identical through the static site and when calling the API directly. `X-Forwarded-For` starts with whatever the visitor sends, so it is not trusted: the Dockerfile runs uvicorn with `--no-proxy-headers`, and `app/core/client_ip.py` reads `CF-Connecting-IP` (setting `CLIENT_IP_HEADER`), falling back to the socket address when the header is missing or not an IP (local development, Render's health check).

If the API is ever reachable without Cloudflare in front (another host, a private network), set `CLIENT_IP_HEADER` to an empty value, otherwise a client could forge the header. The per-email sign-in limit does not depend on any of this.

## Uploads (known gap)

Documents and photos are written to `UPLOAD_DIR` on the instance disk. On Render's free plan that disk is wiped on every deploy and restart, and files are stored unencrypted. Fine for the synthetic demo; **not acceptable for real student documents.** Options, in the order I would consider them:

1. **Render persistent disk** (paid plan, mounted at `/app/uploads`): smallest change, no code change; one instance only; back it up.
2. **S3-compatible object storage** (Cloudflare R2, AWS S3, Neon object storage): survives redeploys and scaling, supports server-side encryption and private signed downloads; needs a small storage layer in `app/utils/file_validation.py` and the download routes.
3. Keep the disk but encrypt files at rest (Fernet, as bank numbers already are): protects against disk exposure, but does not fix loss on redeploy.

## Release and rollback

Render deploys the branch set in the dashboard. Merge to that branch to deploy; the API applies new migrations on start. To roll back code use Render's "Rollback"; migrations are not undone automatically (`alembic downgrade <revision>` against the direct Neon URL, after checking the downgrade is safe).
