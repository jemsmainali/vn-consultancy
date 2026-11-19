"""Seed a DEMO database with synthetic accounts, one per role.

Usage (against the demo database only):
    DEMO_MODE=true DEMO_SEED_PASSWORD=... python -m scripts.seed_demo

Refuses to run unless DEMO_MODE is true. Existing emails are skipped, so it is safe to re-run.
No real people: names, IDs and bank numbers below are made up.
"""
import asyncio
import os
import sys
from datetime import date, datetime, timezone

from sqlalchemy import select

from app.core.bank_data import encrypt_bank_account_number
from app.core.config import settings
from app.core.database import AsyncSessionLocal, engine
from app.core.security import hash_password
from app.models.bank_details import UserBankDetails
from app.models.user import User, UserRole

DEMO_USERS = [
    {"email": "student@demo.example.com", "full_name": "Demo Student", "role": UserRole.student,
     "target_course_level": "Bachelor", "target_field": "Information Technology", "target_country": "Australia"},
    {"email": "parent@demo.example.com", "full_name": "Demo Parent", "role": UserRole.parent},
    {"email": "other@demo.example.com", "full_name": "Demo Partner Agent", "role": UserRole.other,
     "bank": {"account_name": "Demo Partner Agent", "bank_name": "Demo Bank Ltd",
              "account_number": "0000111122223333", "nominee_name": "Demo Nominee"}},
    {"email": "staff@demo.example.com", "full_name": "Demo Counsellor", "role": UserRole.consultancy_staff},
    {"email": "principal@demo.example.com", "full_name": "Demo Principal", "role": UserRole.principal},
]


async def main() -> None:
    if not settings.DEMO_MODE:
        sys.exit("Refusing to seed: DEMO_MODE is not true. Point DATABASE_URL at the demo database only.")
    password = os.environ.get("DEMO_SEED_PASSWORD", "")
    if len(password) < 8:
        sys.exit("Set DEMO_SEED_PASSWORD (8+ characters) for the demo accounts.")

    async with AsyncSessionLocal() as db:
        for spec in DEMO_USERS:
            spec = dict(spec)
            bank = spec.pop("bank", None)
            if (await db.execute(select(User).where(User.email == spec["email"]))).scalar_one_or_none():
                print(f"exists   {spec['email']}")
                continue
            user = User(
                **spec,
                hashed_password=hash_password(password),
                date_of_birth=date(2000, 1, 1),
                gender="Prefer not to say",
                citizenship="Nepal",
                terms_accepted_at=datetime.now(timezone.utc),
                is_verified=True,
                is_approved=True,
            )
            db.add(user)
            await db.flush()
            if bank:
                db.add(UserBankDetails(
                    user_id=user.id,
                    account_name=bank["account_name"],
                    bank_name=bank["bank_name"],
                    account_number_encrypted=encrypt_bank_account_number(bank["account_number"]),
                    account_last4=bank["account_number"][-4:],
                    nominee_name=bank["nominee_name"],
                ))
            print(f"created  {spec['email']} ({spec['role'].value})")
        await db.commit()
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
