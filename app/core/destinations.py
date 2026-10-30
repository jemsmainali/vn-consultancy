from functools import lru_cache
from pathlib import Path

from app.schemas.destination import DestinationGuide

GUIDES_DIR = Path(__file__).resolve().parent.parent / "data" / "destinations"

# Fixed allow-list: request slugs are only ever matched against these, never used to build a path.
DESTINATION_SLUGS = (
    "australia",
    "united-states",
    "united-kingdom",
    "canada",
    "new-zealand",
    "germany",
    "ireland",
    "france",
    "japan",
    "south-korea",
)


@lru_cache
def load_guides() -> dict[str, DestinationGuide]:
    guides = {}
    for slug in DESTINATION_SLUGS:
        guide = DestinationGuide.model_validate_json((GUIDES_DIR / f"{slug}.json").read_text(encoding="utf-8"))
        if guide.slug != slug:
            raise ValueError(f"{slug}.json declares slug {guide.slug!r}")
        guides[slug] = guide
    return guides
