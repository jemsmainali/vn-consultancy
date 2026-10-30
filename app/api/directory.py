from functools import lru_cache
from pathlib import Path

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.directory import Directory

router = APIRouter(prefix="/directory", tags=["directory"])

DIRECTORY_PATH = Path(__file__).resolve().parent.parent / "data" / "universities.json"


@lru_cache(maxsize=1)
def load_directory() -> Directory:
    # Validated on load: an entry with unsourced tuition, deadlines or partner status fails loudly
    # instead of reaching students.
    return Directory.model_validate_json(DIRECTORY_PATH.read_text(encoding="utf-8"))


def directory_refs(kind: str) -> set[str]:
    universities = load_directory().universities
    if kind == "university":
        return {university.id for university in universities}
    return {f"{university.id}/{course.id}" for university in universities for course in university.courses}


@router.get("/universities", response_model=Directory)
async def list_universities(_: User = Depends(get_current_user)):
    return load_directory()
