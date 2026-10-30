import asyncio
import json
import unittest
from types import SimpleNamespace

from pydantic import BaseModel

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.destinations import DESTINATION_SLUGS, load_guides
from app.main import app
from app.models.user import UserRole
from app.schemas.destination import DestinationGuide, DestinationPreview

PREVIEW_KEYS = {field.alias for field in DestinationPreview.model_fields.values()}


def model_keys(model: type[BaseModel]) -> set[str]:
    """Every JSON key that can appear anywhere inside a model."""
    keys = set()
    for field in model.model_fields.values():
        keys.add(field.alias)
        for arg in [field.annotation, *getattr(field.annotation, "__args__", ())]:
            if isinstance(arg, type) and issubclass(arg, BaseModel):
                keys |= model_keys(arg)
    return keys


def payload_keys(value) -> set[str]:
    if isinstance(value, dict):
        return set(value) | {key for item in value.values() for key in payload_keys(item)}
    if isinstance(value, list):
        return {key for item in value for key in payload_keys(item)}
    return set()


def get(path: str, query: str = "") -> tuple[int, dict, object]:
    """Send one GET through the full ASGI app (middleware, routing, dependencies) without httpx."""

    async def run():
        sent = []
        scope = {
            "type": "http", "asgi": {"version": "3.0"}, "http_version": "1.1", "method": "GET",
            "scheme": "http", "path": path, "raw_path": path.encode(), "root_path": "",
            "query_string": query.encode(), "headers": [(b"host", b"testserver")],
            "client": ("127.0.0.1", 50000), "server": ("testserver", 80),
        }

        async def receive():
            return {"type": "http.request", "body": b"", "more_body": False}

        async def send(message):
            sent.append(message)

        await app(scope, receive, send)
        start = next(m for m in sent if m["type"] == "http.response.start")
        body = b"".join(m.get("body", b"") for m in sent if m["type"] == "http.response.body")
        headers = {k.decode().lower(): v.decode() for k, v in start["headers"]}
        return start["status"], headers, json.loads(body) if body else None

    return asyncio.run(run())


async def no_db():
    yield None


class DestinationGuideApiTests(unittest.TestCase):
    def setUp(self):
        app.dependency_overrides[get_db] = no_db

    def tearDown(self):
        app.dependency_overrides.clear()

    def sign_in_as(self, role: UserRole):
        app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(role=role)

    def test_guide_files_cover_all_destinations(self):
        self.assertEqual(set(load_guides()), set(DESTINATION_SLUGS))
        self.assertEqual(len(DESTINATION_SLUGS), 10)

    def test_anonymous_gets_401_on_full_guides(self):
        for slug in [*DESTINATION_SLUGS, "not-a-country"]:
            with self.subTest(slug=slug):
                status, _, body = get(f"/destinations/{slug}")
                self.assertEqual(status, 401)
                self.assertNotIn("tuition", json.dumps(body))

    def test_anonymous_gets_401_on_compare(self):
        status, _, _ = get("/destinations/compare", "slugs=australia,canada")
        self.assertEqual(status, 401)

    def test_preview_contains_no_restricted_fields(self):
        status, _, body = get("/destinations/preview")
        self.assertEqual(status, 200)
        self.assertEqual([item["slug"] for item in body], list(DESTINATION_SLUGS))
        restricted = model_keys(DestinationGuide) - PREVIEW_KEYS
        self.assertIn("studentVisa", restricted)
        for item in body:
            self.assertEqual(set(item), PREVIEW_KEYS)
        self.assertEqual(payload_keys(body) & restricted, set())

    def test_students_and_staff_get_full_guides(self):
        for role in (UserRole.student, UserRole.consultancy_staff):
            with self.subTest(role=role):
                self.sign_in_as(role)
                status, headers, body = get("/destinations/japan")
                self.assertEqual(status, 200)
                self.assertEqual(body["slug"], "japan")
                self.assertIn("studentVisa", body)
                self.assertEqual(headers["cache-control"], "private, no-store")

    def test_other_roles_are_forbidden(self):
        self.sign_in_as(UserRole.parent)
        self.assertEqual(get("/destinations/japan")[0], 403)

    def test_compare_returns_requested_guides(self):
        self.sign_in_as(UserRole.student)
        status, _, body = get("/destinations/compare", "slugs=germany,ireland")
        self.assertEqual(status, 200)
        self.assertEqual([guide["slug"] for guide in body], ["germany", "ireland"])
        self.assertEqual(get("/destinations/compare", "slugs=germany")[0], 422)
        self.assertEqual(get("/destinations/compare", "slugs=germany,atlantis")[0], 404)
        self.assertEqual(get("/destinations/atlantis")[0], 404)


if __name__ == "__main__":
    unittest.main()
