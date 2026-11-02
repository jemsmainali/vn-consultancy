# Backend API image (used by Render; see render.yaml).
# python:3.11 because asyncpg 0.29 has no wheels for newer Pythons; libmagic1 is needed by python-magic.
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends libmagic1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY alembic.ini .
COPY alembic ./alembic
COPY app ./app
COPY scripts ./scripts

RUN useradd --create-home appuser && mkdir -p /app/uploads && chown appuser /app/uploads
USER appuser

# Migrations run on every start (idempotent); Render's free plan has no pre-deploy step.
# --proxy-headers so rate limits key on the real client IP, not Render's proxy.
CMD ["sh", "-c", "alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips='*'"]
