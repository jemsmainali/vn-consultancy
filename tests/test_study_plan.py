import asyncio
import json
import unittest
import uuid
from datetime import datetime, timezone
from unittest.mock import patch

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy.orm.evaluator import _EvaluatorCompiler

from app.api import directory as directory_api
from app.api import study_plan as api
from app.models.study_plan import SavedItem, StudyPlan
from app.models.user import User, UserRole
from app.schemas.directory import Directory, University
from app.schemas.study_plan import SavedItemCreate, StudyPlanUpdate


SOURCE = {"source_url": "https://example.edu/fees", "checked_on": "2026-10-01"}
FIXTURE = Directory.model_validate({"universities": [{
    "id": "example-university", "name": "Example University", "country": "australia", "city": "Sydney",
    "official_url": "https://example.edu", "levels": ["bachelor", "master"],
    "courses": [{"id": "msc-data", "name": "MSc Data Science", "level": "master", "official_url": "https://example.edu/msc"}],
}]})


class _Result:
    def __init__(self, rows):
        self.rows = rows

    def scalar_one_or_none(self):
        assert len(self.rows) <= 1
        return self.rows[0] if self.rows else None

    def scalars(self):
        return self

    def all(self):
        return list(self.rows)


class FakeSession:
    """Keeps rows in memory and applies each statement's real WHERE clause with SQLAlchemy's evaluator."""

    def __init__(self):
        self.rows, self.pending = [], []

    def add(self, obj):
        self.pending.append(obj)

    async def execute(self, stmt):
        entity = stmt.column_descriptions[0]["entity"]
        matches = _EvaluatorCompiler(entity).process(stmt.whereclause)
        return _Result([row for row in self.rows if isinstance(row, entity) and matches(row)])

    async def commit(self):
        now = datetime.now(timezone.utc)
        for obj in self.pending:
            obj.id = obj.id or uuid.uuid4()
            obj.created_at = now
            if isinstance(obj, StudyPlan):
                obj.updated_at = now
            self.rows.append(obj)
        self.pending = []

    async def refresh(self, obj):
        pass

    async def rollback(self):
        self.pending = []

    async def delete(self, obj):
        self.rows.remove(obj)


def student(role=UserRole.student):
    return User(id=uuid.uuid4(), role=role, email=f"{uuid.uuid4()}@example.com", full_name="Student")


def run(coro):
    return asyncio.run(coro)


@patch.object(directory_api, "load_directory", lambda: FIXTURE)
class StudyPlanOwnershipTests(unittest.TestCase):
    def setUp(self):
        self.db = FakeSession()
        self.alice, self.bob = student(), student()

    def save(self, user, kind="university", ref="example-university"):
        return run(api.save_item(SavedItemCreate(kind=kind, ref=ref), current_user=user, db=self.db))

    def test_saved_items_are_only_listed_for_their_owner(self):
        self.save(self.alice)
        self.save(self.alice, kind="course", ref="example-university/msc-data")
        self.assertEqual(len(run(api.my_study_plan(current_user=self.alice, db=self.db)).saved_items), 2)
        self.assertEqual(run(api.my_study_plan(current_user=self.bob, db=self.db)).saved_items, [])

    def test_cannot_delete_another_students_item(self):
        item = self.save(self.alice)
        with self.assertRaises(HTTPException) as denied:
            run(api.remove_saved_item(item.id, current_user=self.bob, db=self.db))
        self.assertEqual(denied.exception.status_code, 404)
        self.assertIn(item, self.db.rows)
        run(api.remove_saved_item(item.id, current_user=self.alice, db=self.db))
        self.assertNotIn(item, self.db.rows)

    def test_plan_updates_stay_with_the_signed_in_student(self):
        run(api.update_my_study_plan(StudyPlanUpdate(preferred_countries=["canada"]), current_user=self.alice, db=self.db))
        run(api.update_my_study_plan(StudyPlanUpdate(preferred_countries=["japan"]), current_user=self.bob, db=self.db))
        run(api.update_my_study_plan(StudyPlanUpdate(preferences={"intake": "Feb 2027"}), current_user=self.alice, db=self.db))
        alice = run(api.my_study_plan(current_user=self.alice, db=self.db))
        bob = run(api.my_study_plan(current_user=self.bob, db=self.db))
        self.assertEqual((alice.preferred_countries, alice.preferences.intake), (["canada"], "Feb 2027"))
        self.assertEqual((bob.preferred_countries, bob.preferences.intake), (["japan"], None))
        self.assertEqual(len([row for row in self.db.rows if isinstance(row, StudyPlan)]), 2)

    def test_duplicates_are_per_student(self):
        self.save(self.alice)
        with self.assertRaises(HTTPException) as duplicate:
            self.save(self.alice)
        self.assertEqual(duplicate.exception.status_code, 409)
        self.save(self.bob)

    def test_only_directory_items_can_be_saved(self):
        for kind, ref in [("university", "not-listed"), ("course", "example-university/not-listed"), ("course", "example-university")]:
            with self.assertRaises(HTTPException) as missing:
                self.save(self.alice, kind=kind, ref=ref)
            self.assertEqual(missing.exception.status_code, 404)
        self.assertEqual([row for row in self.db.rows if isinstance(row, SavedItem)], [])


class StudyPlanAccessTests(unittest.TestCase):
    def test_every_route_requires_the_student_role(self):
        for route in api.router.routes:
            self.assertIn(api.student_only, [dep.call for dep in route.dependant.dependencies], route.path)

    def test_non_students_are_rejected(self):
        for role in (UserRole.parent, UserRole.principal, UserRole.other, UserRole.consultancy_staff):
            with self.assertRaises(HTTPException) as denied:
                run(api.student_only(user=student(role)))
            self.assertEqual(denied.exception.status_code, 403)

    def test_plan_input_is_bounded(self):
        with self.assertRaises(ValidationError):
            StudyPlanUpdate(preferred_countries=["atlantis"])
        with self.assertRaises(ValidationError):
            StudyPlanUpdate(preferences={"anything": "else"})
        self.assertEqual(StudyPlanUpdate(preferred_countries=["canada", "canada"]).preferred_countries, ["canada"])


class DirectoryDataTests(unittest.TestCase):
    def university(self, **overrides):
        values = json.loads(FIXTURE.universities[0].model_dump_json())
        values.update(overrides)
        return values

    def test_shipped_directory_file_is_valid(self):
        directory_api.load_directory.cache_clear()
        self.assertIsInstance(directory_api.load_directory(), Directory)

    def test_tuition_and_deadlines_need_an_official_source(self):
        course = {"id": "msc", "name": "MSc Data", "level": "master", "official_url": "https://example.edu/msc"}
        with self.assertRaises(ValidationError):
            University(**self.university(courses=[{**course, "tuition": {"amount": 40000, "currency": "AUD", "period": "year"}}]))
        with self.assertRaises(ValidationError):
            University(**self.university(courses=[{**course, "deadlines": [{"intake": "Feb 2027", "deadline": "2026-11-30"}]}]))
        University(**self.university(courses=[{**course, "tuition": {"amount": 40000, "currency": "AUD", "period": "year", **SOURCE}}]))

    def test_partner_badge_needs_a_verification_date(self):
        self.assertFalse(University(**self.university()).vn_partner_verified)
        with self.assertRaises(ValidationError):
            University(**self.university(vn_partner_verified=True))
        University(**self.university(vn_partner_verified=True, partner_verified_on="2026-10-01"))

    def test_unknown_country_is_rejected(self):
        with self.assertRaises(ValidationError):
            University(**self.university(country="atlantis"))


if __name__ == "__main__":
    unittest.main()
