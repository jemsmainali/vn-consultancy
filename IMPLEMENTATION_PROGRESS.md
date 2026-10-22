# Implementation Progress

Updated: 2026-10-09

## Completed

- Audited the existing FastAPI, React/Vite, PostgreSQL, and Alembic implementation; findings are in `PROJECT_AUDIT.md`.
- Confirmed the original PostgreSQL Alembic head `d16b16aa6abf` and inspected the live table/column/foreign-key/index inventory read-only.
- Added a responsive public website with home, about, destination overview, student journey, FAQs, contact, privacy/data, and custom not-found pages.
- Kept the existing portal pages and API behavior; student documents now live at `/portal`, and existing messaging/profile/staff paths remain available.
- Added site-wide title, description, and social metadata, and documented local and production build steps.
- Replaced the portal-oriented landing page with a section-led public homepage: About, destinations, currently available portal workflows, institution disclosure, process, Gallery, neutral story/news placeholders, FAQs, and the existing enquiry form. Existing About, Destinations, Journey, FAQs, Contact, Privacy, Terms, portal, and staff routes remain available.
- Added Manrope/Inter typography, responsive anchor navigation with active-section indication, local WebP photography, and source/license notes in `PHOTO_CREDITS.md`. Stock photos are marked illustrative rather than presented as VN activities or student outcomes.
- Added staff-managed gallery content with JPEG/PNG/WebP/AVIF upload validation, caption/alt text/category/order editing, publish controls, publication-rights confirmation, private unpublished image delivery, and audit records.
- Added and applied Alembic revisions `c6f14a8d2b91` and `f2a74b901d6c` for the gallery table and publication-rights flag. No existing table was dropped or reset.
- Fixed an unauthenticated public-route regression: an unsuccessful session refresh no longer sends homepage visitors to `/login`; protected routes retain their existing guards.
- Restricted messaging at the API layer so non-staff users can only message active, approved consultancy staff; missing recipients return 404.
- Added the consented public enquiry form, factual data-handling page, staff-only lead dashboard, filters, assignment, status updates, follow-up scheduling, and staff-only notes.
- Added and applied the additive Alembic revision `e812c9f2a731`, which creates `student_enquiries` and its lookup indexes without changing existing tables.
- During review, moved lead search values out of GET query strings into a staff-only POST body, normalized date filters to UTC, and made the date range end exclusive to include the full selected date.
- Added and applied follow-up Alembic revision `b5c43a908e11`, which adds a unique enquiry submission key and backfills prior enquiry rows without removing them.
- No existing users, documents, messages, uploads, or environment files were changed. The follow-up migration only backfills an idempotency key on the new enquiry table.

## Verification

- Frontend production build: passed (`npm run build`) after all current UI changes.
- Backend import: passed; 48 FastAPI routes registered after adding the gallery endpoints.
- Backend compile check: passed (`python -m compileall -q app`).
- Messaging permission change: backend module compiles; no automated integration suite exists in the repository.
- Backend smoke check: Uvicorn started and `GET /health` returned `{"status":"ok"}`.
- Updated migration state: `alembic current` reports `f2a74b901d6c (head)`; `alembic check` confirms ORM/database alignment.
- Enquiry schema checks: valid fields passed; invalid phone, missing consent, and clearing a lead status were rejected.
- HTTP smoke checks: `/health` returned 200; unauthenticated `POST /enquiries/staff/search` returned 401; invalid public enquiry input returned 422.
- Transactional PostgreSQL workflow: create, retry de-duplication, search, assignment, status/follow-up/note update passed; temporary rows were rolled back and verified absent.
- Live HTTP/PostgreSQL workflow: public enquiry creation returned 201, same-key retry returned the same reference, changed content with the same key returned 409, and unauthenticated staff search returned 401. The synthetic enquiry was committed, then deleted by its unique test key and verified absent.
- Final checks after review: `python -m compileall -q app`, OpenAPI route/body inspection, `alembic current` (`f2a74b901d6c`), and `alembic check` all passed (`No new upgrade operations detected`).
- Automated project tests: none found in the repository.
- Final senior review: `npm run build`, backend `compileall`, FastAPI import (48 routes), `alembic current` (`f2a74b901d6c`), and `alembic check` passed. Package scripts contain no test or lint command; no project test files were found outside dependency directories.
- Senior-review fixes: gallery card image fallback now handles failed sources, public filters include the admin-supported Team category, and upload guidance lists JPEG, PNG, WebP, and AVIF consistently with backend validation.
- Gallery PostgreSQL workflow: synthetic staff and gallery records were created; WebP upload validation, unpublished-image privacy, publication rejection without rights confirmation (422), publication, editing/reordering, unpublishing, deletion, and file cleanup passed. Temporary rows, audit records, and the uploaded file were removed and verified absent.
- Gallery HTTP smoke checks: `GET /gallery` returned 200; unauthenticated staff listing and unpublished-image management returned 401; health returned 200.
- Headless Edge at 320, 375, 390, 768, 1024, and 1366 CSS pixels: no horizontal overflow, loaded-image failures, or uncaught JavaScript exceptions. Mobile menu, anchor navigation, gallery filtering, Escape-to-close lightbox, and empty enquiry-form validation worked. Session checks returned expected unauthenticated 401 responses without redirecting the public homepage.

## Remaining production work

- The existing Terms page is placeholder copy; registration collects identity and family information. Approve the factual privacy notice and terms, and define retention before real student data collection.
- Supply verified business contact details, service availability, staff information, and any genuine testimonials before publishing those claims.
- Appointment scheduling still needs a verified availability and conflict-prevention workflow.
- Configure production domain, CORS, HTTPS/secure cookies, private durable document storage, backups, and malware scanning.
- Add backend/frontend automated tests and accessibility checks; confirm current destination requirements using official sources before publishing specifics.
- Add unique per-route SEO metadata, canonical URLs, sitemap, and robots configuration after the production domain is known.
- Supply real VN Group photography and verified company, partner, event, service, and student-story content; the current stock photos and story/news/partner sections are explicitly illustrative or neutral placeholders.

## Brand update — 2026-10-09

- Added the supplied VN Group logo, cropped to its visible mark, to the public header/footer and authenticated app shell; added it to social sharing metadata.
- Replaced the displayed company name across frontend pages, account and staff workflows, API messages, email copy, metadata, and project guides with “VN Group”. Existing `consultancy_staff` role identifiers and stored database records remain unchanged.
- Updated primary interface colors to the logo's blue, gold, black, and white palette.
- Verification: frontend production build passed; backend Python compilation passed; repository search found no remaining superseded brand text.
