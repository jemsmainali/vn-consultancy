# Architecture (audit, 2026-10-30)

**Stack:** FastAPI + async SQLAlchemy 2 (asyncpg, PostgreSQL) + Alembic in `app/`; React 18 + Vite 5 + Tailwind + react-router 6 in `vn-frontend/`. Uploads on disk in `uploads/`.

## Frontend routes (`vn-frontend/src/main.jsx`)
- **Public (`PublicLayout`, PublicSite.jsx):** `/`, `/about`, `/destinations`, `/destinations/:slug`, `/journey`, `/faqs`, `/gallery`, `/contact`, `/privacy`, `/terms`, `/refund-policy`, `*` (NotFound)
- **Auth (no layout guard):** `/login`, `/register`, `/verify`, `/forgot-password`, `/reset-password`
- **`Guard` (any signed-in user, portal `Layout`):** `/portal` (Documents), `/messages`, `/profile`
- **`StaffGuard` (`consultancy_staff` only):** `/leads`, `/gallery-admin`, `/approvals`, `/users`, `/audit-log`

## API routes (`app/main.py` mounts `app/api/*`)
- **auth `/auth`:** `register` (multipart), `verify-email`, `resend-otp`, `forgot-password`, `reset-password`, `login`, `token` (hidden), `refresh`, `logout`, `GET /staff`; `GET|PATCH /me`, `GET|POST /me/photo`; staff-only: `GET /pending`, `GET /users`, `POST /{id}/approve|reject|deactivate|reactivate`
- **documents `/documents`:** `POST /upload`, `GET /mine` (owners); `GET ""` (staff); `GET /{id}`, `GET /{id}/file` (owner or staff); `POST /{id}/replace`, `DELETE /{id}` (owners); `PATCH /{id}/status` (staff)
- **enquiries `/enquiries`:** `POST ""` (public, rate-limited, idempotent via `submission_key`); staff: `POST /staff/search`, `GET|PATCH /staff/{id}`
- **messages `/messages`:** `POST ""`, `GET /contacts`, `GET /thread/{user_id}`, `PATCH /{id}/read`. Non-staff may message approved staff only.
- **gallery `/gallery`:** `GET ""`, `GET /{id}/image` (public, published only); staff: `GET /staff`, `GET /staff/{id}/image`, `POST ""`, `PATCH|DELETE /{id}`
- **audit `/audit-logs`:** `GET ""` (staff). **health:** `GET /health`

## Auth and roles
- JWT access (20 min) and refresh (7 days) tokens in httpOnly cookies (`access_token` path `/`, `refresh_token` path `/auth`). Refresh rotates both.
- `app/api/deps.py`: `get_current_user` reads the cookie; `require_role(*roles)` returns 403 otherwise.
- `UserRole`: `student`, `principal`, `parent`, `other`, `consultancy_staff`. Email OTP verification on register. `principal` and `consultancy_staff` need staff approval (`is_approved`). Optional encrypted bank details for non-students (`REQUIRE_BANK_DETAILS_FOR_NON_STUDENTS`).
- Frontend: `auth.jsx` `AuthProvider` loads `/auth/me`; `api.js` `api()` retries once after `/auth/refresh` on 401, else redirects to `/login`.

## Models (`app/models/`)
`User` (profile, passport, target course level/field/country, parent contact, photo, flags) · `UserBankDetails` · `EmailOTP` · `Document` (owner, doc_type, college/university, file meta, status `pending|under_review|reviewed|rejected`) · `StudentEnquiry` (lead with status `new→contacted→counselling→documents_pending→application_in_progress→submitted→decision_received→closed`, assignee, follow-up, notes) · `Message` (sender, receiver, optional document_id, read) · `GalleryItem` · `AuditLog`. Migrations: `alembic/versions/` (9 revisions).

## Layout components
- `ui.jsx`: portal `Layout` (sidebar with `WORKSPACE_LINKS` and `STAFF_LINKS`, pending badge) and primitives: `Card`, `Btn`, `Input`, `Select`, `Field`, `PageHeader`, `StatusBadge`, `EmptyState`, `Pagination`, `Avatar`, `Icon`.
- `PublicSite.jsx` `PublicLayout`; `components/layout/` `SiteFooter`, `WhatsAppButton`, `LegalPage`; `components/auth/` `AuthLayout`, `AuthField`; `components/ui/` `ConfirmDialog`, `ListSkeleton`, `PasswordInput`; `components/home/*` homepage sections.

## Static data (`vn-frontend/src/data/`)
`siteContent.js` (brand, contact, images, page copy) · `faqs.js` · `journey.js` (steps and disclaimer) · `galleryPhotos.js` (static photos plus API mapper) · `destinations/registry.js` (10 countries: slug, name, code, currency, card image) · `destinations/meta.js` (research date, NPR exchange rates, formatters, claim types) · `destinations/countries/*.js` (intro, quick facts, costs, admission, scholarships, visa, sources).

## Build and test commands
- Backend: `pip install -r requirements.txt`, `alembic upgrade head`, `uvicorn app.main:app --reload`. Tests: `python -m unittest discover tests` (only `tests/test_bank_details.py`; no pytest in requirements).
- Frontend (`vn-frontend/`): `npm run dev` (port 5173), `npm run build`, `npm run preview`. No lint or test script. API base: `VITE_API_URL` (default `http://127.0.0.1:8000`). `api/enquiry.js` falls back to `/api/enquiries`, but `vite.config.js` defines no proxy.

## Exists vs missing
| Area | Exists | Missing |
|---|---|---|
| Student dashboard | `/portal` = documents list; Messages, Profile; shared portal `Layout` | Overview page, progress or next-step widgets, role-specific landing (parent and principal see the same nav) |
| Study plan | `User.target_*` fields; enquiry `education_level/study_field/intended_intake`; static `journey.js` steps | No model, API or UI for a per-student plan, milestones or tasks |
| Applications | Enquiry status stages (staff-only); `Document.university_name/college_name` | No Application model or API, no student-visible status, no link from user to enquiry |
| Destination data | 10 static country files, hub and detail pages, NPR conversion, sources | Not in DB or API; no staff editing; no course or institution records; rates and research date are hard-coded |
