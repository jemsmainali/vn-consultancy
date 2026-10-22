from cryptography.fernet import Fernet

from app.core.config import settings


def encrypt_bank_account_number(account_number: str) -> str:
    key = settings.BANK_DATA_ENCRYPTION_KEY
    if not key:
        raise ValueError("Bank encryption is not configured.")
    try:
        return Fernet(key.encode("ascii")).encrypt(account_number.encode("ascii")).decode("ascii")
    except (ValueError, UnicodeEncodeError, TypeError):
        raise ValueError("Bank encryption is not configured.") from None
