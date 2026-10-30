from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.core.validation_errors import validation_errors_without_input
from app.api.auth import router as auth_router, limiter
from app.api.documents import router as documents_router
from app.api.messages import router as messages_router
from app.api.audit import router as audit_router
from app.api.enquiries import router as enquiries_router
from app.api.gallery import router as gallery_router
from app.api.directory import router as directory_router
from app.api.study_plan import router as study_plan_router
from app.api.destinations import router as destinations_router


app = FastAPI(
    title="VN Group API",
    version="1.0.0",
    # Hide interactive docs in production - don't expose your whole schema publicly.
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url=None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.exception_handler(RequestValidationError)
async def sanitize_bank_validation_errors(request: Request, exc: RequestValidationError):
    # Form parsing can attach the whole multipart payload to an unrelated
    # validation error (for example, a missing photo), so never echo input.
    errors = validation_errors_without_input(exc.errors())
    return JSONResponse(status_code=422, content=jsonable_encoder({"detail": errors}))

app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,   # never "*" in production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if settings.ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    return response


app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(messages_router)
app.include_router(audit_router)
app.include_router(enquiries_router)
app.include_router(gallery_router)
app.include_router(directory_router)
app.include_router(study_plan_router)
app.include_router(destinations_router)

@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok"}
