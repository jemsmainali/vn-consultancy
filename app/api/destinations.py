from fastapi import APIRouter, Depends, HTTPException, Query, Response

from app.api.deps import require_role
from app.core.destinations import load_guides
from app.models.user import User, UserRole
from app.schemas.destination import DestinationGuide, DestinationPreview

# Served publicly under /api/destinations by the same proxy prefix as /api/enquiries.
router = APIRouter(prefix="/destinations", tags=["destinations"])

GUIDE_READERS = (UserRole.student, UserRole.consultancy_staff)
MAX_COMPARE = 3


def _private(response: Response) -> None:
    # Full guides are account-only content; keep them out of shared caches.
    response.headers["Cache-Control"] = "private, no-store"


def _guide(slug: str) -> DestinationGuide:
    guide = load_guides().get(slug)
    if guide is None:
        raise HTTPException(status_code=404, detail="Destination guide not found")
    return guide


@router.get("/preview", response_model=list[DestinationPreview])
async def destination_previews():
    return [DestinationPreview.from_guide(guide) for guide in load_guides().values()]


# Declared before /{slug} so "compare" is not treated as a slug.
@router.get("/compare", response_model=list[DestinationGuide])
async def compare_destinations(
    response: Response,
    slugs: str = Query(..., max_length=200, description="Comma-separated destination slugs"),
    current_user: User = Depends(require_role(*GUIDE_READERS)),
):
    requested = list(dict.fromkeys(slug.strip() for slug in slugs.split(",") if slug.strip()))
    if not 2 <= len(requested) <= MAX_COMPARE:
        raise HTTPException(status_code=422, detail=f"Choose between 2 and {MAX_COMPARE} destinations to compare")
    _private(response)
    return [_guide(slug) for slug in requested]


@router.get("/{slug}", response_model=DestinationGuide)
async def destination_guide(
    slug: str,
    response: Response,
    current_user: User = Depends(require_role(*GUIDE_READERS)),
):
    guide = _guide(slug)
    _private(response)
    return guide
