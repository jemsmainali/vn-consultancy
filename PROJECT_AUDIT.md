# VN Group Project Audit

Audit date: 2026-10-09

## Architecture and dependencies

- **Verified:** The backend is a modular FastAPI application (`app/main.py`) using SQLAlchemy 2 async sessions, `asyncpg`, Pydantic v2, and settings loaded with `pydantic-settings`.
- **Verified:** Authentication uses password hashing through Passlib/bcrypt and JWTs held in HTTP-only cookies. OTP flows support account verification and password reset; email is sent through `aiosmtplib` when configured.
- **Verified:** The frontend is React 18, React Router 6, Vite, and Tailwind CSS. It uses a small fetch-based API client and cookie credentials.
- **Verified:** There is no Git metadata in the workspace, automated test suite, CI configuration, Docker/deployment configuration, or frontend lint/test script in the files inspected.
- **Verified:** The existing README describes a student document and messaging portal. The workspace also contains uploaded student documents and profile photos; these are ignored by `.gitignore` and were not opened.

## Routes, pages, and APIs

- **Verified:** Backend routes are `/health`; `/auth` registration, login, token, refresh, logout, current profile/photo, verification, password recovery, staff listing, pending approvals, user listing, and staff account actions; `/documents` upload/list/get/replace/delete/status/file; `/messages` send/contacts/thread/read; and `/audit-logs`.
- **Verified:** React pages include Login, Register, Verify, Terms, Documents, Messages, Profile, Approvals, AuditLog, Users, ForgotPassword, and ResetPassword. Protected portal routes are `/`, `/messages`, `/profile`, `/approvals`, `/audit-log`, and `/users`.
- **Verified:** No public marketing, destination, university/course catalogue, appointment, enquiry/lead, scholarship, or content-management routes/pages were found.

## PostgreSQL and migrations

- **Verified:** ORM tables are `users`, `documents`, `messages`, `audit_logs`, and `email_otps`; models use PostgreSQL UUIDs, enums, foreign keys, timestamps, and a unique indexed user email. Uploaded file bytes are on local disk, not in PostgreSQL.
- **Verified:** Four linear Alembic revisions exist from `61798b6f150e` through `d16b16aa6abf`. A read-only `alembic current` check connected successfully and reported `d16b16aa6abf (head)`.
- **Verified:** A read-only live PostgreSQL inspection confirmed the five application tables plus `alembic_version`, the columns and foreign keys represented by the models, unique indexes on user email and national ID, and an email lookup index for OTPs. No secondary indexes were found on documents, messages, or audit timestamps.
- **Verified:** The informational pages needed no database change. The enquiry workflow added one additive Alembic revision; the previous tables and their records were left intact.

## Working and incomplete features

- **Verified:** Core account verification, cookie-based authentication, profile editing/photo upload, document upload/replacement/deletion/review, direct messages, staff approvals, user activation controls, and audit-log viewing have corresponding backend and frontend code.
- **Verified:** Document downloads are authorization-checked and audited. The upload validator and endpoint rate limits exist.
- **Verified:** The public signup endpoint accepts `student` by default; elevated `principal` and `consultancy_staff` registration requires configured invite codes and approvals.
- **Verified:** OTP sending prints reset codes when email is disabled. This is useful for development but must not be enabled in production logs.
- **Verified at initial audit:** The app had no real public lead capture or appointment booking. A persistent enquiry workflow has since been added and verified; appointment booking remains unimplemented because no availability rules or scheduling workflow were supplied.
- **Suspected:** The backend's `/health` endpoint only reports process health and does not test database connectivity.

## Broken workflows and technical debt

- **Verified:** The Vite frontend's default `/` route is a protected document portal, so there is no public-facing landing experience.
- **Verified:** The project has no automated tests or frontend lint script, and no Git repository metadata is available for a normal diff/status review.
- **Suspected:** Password reset updates the password but does not invalidate already-issued access/refresh tokens before expiry.
- **Verified and fixed:** The original message endpoint accepted any existing account UUID. It now checks that recipients are active and limits non-staff accounts to approved consultancy staff, returning clear 404/403 responses.
- **Suspected:** Contact and thread retrieval load unbounded message histories, and contact collection loads all messages before deduplicating in Python.
- **Unverified:** The third-party email and local filesystem upload flows have not been exercised in this audit.

## UI/UX and accessibility

- **Verified:** Existing pages use a shared set of small UI primitives and a blue/gold/white palette based on the VN Group logo supplied on 2026-10-09. Focus-visible styling is present.
- **Verified:** The application shell has a flex-wrapped desktop-oriented navigation. Mobile menu behavior is not implemented as a dedicated responsive control.
- **Verified:** `index.html` contains a basic title and viewport but no description or social metadata. No sitemap or robots file was found.
- **Suspected:** Some page-level form controls and state messages need a full keyboard/screen-reader review; no accessibility tooling is configured.
- **Verified:** A VN Group logo has been supplied, but no full brand guide or verified staff biographies, testimonials, university partnerships, company history, phone number, or address was present in the files audited. New public content must avoid inventing these facts.
- **Verified:** The existing Terms page explicitly contains placeholder text, registration asks for identity and family details, and no privacy page or documented retention policy exists. Approved privacy/terms content is a production readiness requirement for collecting real student records.

## Security and performance

- **Verified:** CORS uses an explicit configured origin list, browser tokens are HTTP-only cookies, auth endpoints have SlowAPI limits, backend security headers are set, staff routes use API-layer role checks, and file bytes are sniffed before storage.
- **Verified:** The message API now enforces the intended student-to-consultancy recipient boundary server-side.
- **Suspected:** Cookie-authenticated state-changing endpoints do not use a CSRF token. `SameSite=Lax` helps but should be assessed against the actual production origin and deployment topology.
- **Suspected:** `COOKIE_SECURE` defaults to false; production deployment must explicitly set it true and serve over HTTPS.
- **Suspected:** Email content interpolates a user's name into HTML without escaping. OTP development output includes the recipient and code.
- **Suspected:** `settings.DATABASE_URL` is copied into Alembic configuration; URL percent characters may need escaping for certain credentials. Never print this setting.
- **Verified:** Documents are stored under local `uploads/`; malware scanning and durable private object storage are not configured.
- **Verified:** Privacy and retention documentation for personal identity information collected by registration is missing. A public enquiry form now collects consent and persists leads, so approved privacy/terms content and a retention policy are production readiness requirements before real student data collection.
- **Unverified:** Production CORS origins, secret strength, SMTP settings, backup cadence, reverse-proxy limits, database indexes, and storage permissions cannot be validated without exposing configuration or reviewing deployment infrastructure.

## Deployment and configuration

- **Verified:** Configuration is based on environment variables and `.env`; `.env` is ignored. `.env.example` exists, as do pinned Python requirements and npm lockfiles.
- **Verified:** README setup instructions exist, but no deployment-specific infrastructure or health checks are supplied.
- **Verified:** The database was initially at `d16b16aa6abf`. Four additive Alembic revisions were subsequently applied for enquiries/idempotency and gallery/publication authorization; the live database is now at `f2a74b901d6c`, and `alembic check` reports no model/schema drift.
- **Unverified:** No production hosting platform, public domain, verified contact channels, analytics provider, or email sender configuration was identified.

## Prioritized implementation plan

1. **P0 — Preserve security and data:** Keep the existing API, schema, migrations, and authenticated portal intact; avoid touching uploads or credentials.
2. **P1 — Public experience:** Completed: an accessible responsive public landing page and factual information pages link into the existing portal.
3. **P2 — Business operations:** Completed for student enquiries: persisted submissions, consent, public rate limiting, a staff-only searchable lead workflow, assignment, status, follow-up, and internal notes. Appointment booking remains unimplemented pending a verified availability and scheduling workflow.
4. **P3 — Content and student operations:** Build catalogue/content management and student progress features only when supported by authoritative content and business requirements.
5. **P4 — Quality and deployment:** Add targeted tests, responsive/accessibility checks, production settings validation, health/readiness monitoring, and documented backup/storage operations.

## Risks and unresolved assumptions

- **Unverified:** Business contact details, operating history, services actually offered, counsellor profiles, supported destinations, and any testimonials/partnerships have not been supplied.
- **Unverified:** Production deployment, public origin, data-retention obligations, and backup/recovery process.
- **Verified:** The live database is reachable and at the current migration head. The enquiry and gallery changes were additive and preserved existing application tables and records; future database changes should use reviewed migrations and a recovery plan.
- **Verified:** Workspace has no Git metadata, so diff review relies on inspecting created/modified files and running the available project checks.

## Implementation update

- **Verified:** Public pages and the `/portal` alias for student documents have been added; the existing messaging and staff route paths remain available.
- **Verified:** `POST /enquiries` stores consented enquiries and returns a reference after commit. Staff-only `POST /enquiries/staff/search`, `GET/PATCH /enquiries/staff/{id}` support filtering, pagination, assignment, status changes, follow-up dates, internal notes, and audit entries.
- **Verified:** Alembic revision `e812c9f2a731` adds the `student_enquiries` table; follow-up revision `b5c43a908e11` adds a unique idempotency key and backfills existing enquiry rows. Both are additive; `alembic check` found no model/schema drift.
- **Verified:** Enquiry and assigned-staff controls enforce server-side validation and authorization. Public submission is rate-limited.
- **Verified and fixed during review:** Staff search terms travel in an authorized POST body rather than a URL query string, reducing exposure of names/email searches in access logs. Date filters normalize to UTC and the end date uses an exclusive next-day bound. Enquiry retries use a unique submission key and reject reuse with different content.
- **Verified:** Site-wide title, description, and social metadata are configured. Unique per-route metadata, canonical URLs, sitemap, and robots directives remain unimplemented because no public domain is configured.
- **Verified:** A PostgreSQL transactional create/search/retry/update workflow passed and rolled back its temporary rows. A separate live HTTP/PostgreSQL workflow then committed a synthetic enquiry, confirmed a same-key retry returned the same reference, confirmed changed content with that key returned HTTP 409, and confirmed unauthenticated staff search returned HTTP 401. The synthetic row was deleted by its unique test key and verified absent.
- **Verified:** The section-led homepage follows KIEC's information architecture as inspiration without copying its text, branding, or photography. The public sections include About, destinations, current portal workflows, partner disclosure, process, gallery, neutral stories/news states, FAQs, and the saved enquiry form. Existing public detail and portal routes remain available.
- **Verified:** Staff gallery APIs support image upload, metadata/category/order edits, publish/unpublish, and delete. Unpublished images are available only through a staff-authorized endpoint; publishing requires an explicit rights/consent attestation. The new gallery table and authorization field came from additive migrations `c6f14a8d2b91` and `f2a74b901d6c`.
- **Verified:** A synthetic gallery workflow validated WebP storage, public privacy before publication, refusal to publish without an attestation (422), publish, edit/reorder, unpublish, delete, and cleanup of all temporary rows/files. Live HTTP checks confirmed `GET /gallery` returns 200 and unauthenticated staff gallery endpoints return 401.
- **Verified:** Headless Edge checks at 320, 375, 390, 768, 1024, and 1366 CSS pixels found no horizontal overflow, failed loaded images, or uncaught JS exceptions. Mobile navigation, anchor links, gallery filtering, keyboard Escape-to-close, and empty enquiry validation worked. The initial unauthenticated session probe returned expected 401 responses; the homepage stayed public after the redirect fix.
- **Verified:** Unsplash photos are locally stored as WebP, source/licensing information is in `PHOTO_CREDITS.md`, and public placeholders are clearly labeled. No VN event, partner, achievement, or student result is inferred from stock photos.
- **Unverified:** No staff-authenticated browser session or real VN-owned-photo publication was available. Approved privacy/terms wording and retention procedures remain production prerequisites; sitemap, canonical URLs, and a11y assistive-technology audit also remain outstanding.
