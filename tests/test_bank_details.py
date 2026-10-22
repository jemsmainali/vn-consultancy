import unittest
from unittest.mock import patch

from cryptography.fernet import Fernet
from pydantic import ValidationError

from app.core.config import settings
from app.models.user import UserRole
from app.schemas.user import UserCreate, UserOut
from app.core.bank_data import encrypt_bank_account_number
from app.core.validation_errors import validation_errors_without_input


class BankRegistrationSchemaTests(unittest.TestCase):
    def payload(self, **overrides):
        values = {
            "full_name": "Example User",
            "email": "example@example.com",
            "password": "valid-password-123",
            "role": UserRole.consultancy_staff,
            "national_id": "1234567890",
            "date_of_birth": "1990-01-01",
            "gender": "Other",
            "citizenship": "Nepali",
            "terms_accepted": True,
        }
        values.update(overrides)
        return values

    def test_feature_off_ignores_details_and_keeps_existing_signup(self):
        with patch.object(settings, "REQUIRE_BANK_DETAILS_FOR_NON_STUDENTS", False):
            created = UserCreate(**self.payload(bank_name="Example Bank", bank_account_number="001234567890"))
        self.assertIsNone(created.bank_name)
        self.assertIsNone(created.bank_account_number)

    def test_student_ignores_bank_details_even_when_enabled(self):
        with patch.object(settings, "REQUIRE_BANK_DETAILS_FOR_NON_STUDENTS", True):
            created = UserCreate(**self.payload(role=UserRole.student, bank_name="Example Bank", bank_account_number="001234567890"))
        self.assertIsNone(created.bank_name)
        self.assertIsNone(created.bank_account_number)

    def test_non_student_requires_and_normalizes_bank_details(self):
        with patch.object(settings, "REQUIRE_BANK_DETAILS_FOR_NON_STUDENTS", True):
            with self.assertRaises(ValidationError) as missing:
                UserCreate(**self.payload())
            self.assertEqual({error["loc"][-1] for error in missing.exception.errors()}, {"bank_name", "bank_account_number"})

            created = UserCreate(**self.payload(bank_name="  Example Bank  ", bank_account_number="0012 3456-7890"))
        self.assertEqual(created.bank_name, "Example Bank")
        self.assertEqual(created.bank_account_number, "001234567890")

    def test_invalid_account_error_can_be_returned_without_input(self):
        secret_value = "12345678\nDO-NOT-ECHO"
        with patch.object(settings, "REQUIRE_BANK_DETAILS_FOR_NON_STUDENTS", True):
            with self.assertRaises(ValidationError) as invalid:
                UserCreate(**self.payload(bank_name="Example Bank", bank_account_number=secret_value))
        safe_errors = invalid.exception.errors(include_input=False)
        self.assertNotIn(secret_value, repr(safe_errors))
        self.assertNotIn("input", safe_errors[0])


class BankEncryptionTests(unittest.TestCase):
    def test_account_number_is_fernet_encrypted(self):
        account_number = "001234567890"
        key = Fernet.generate_key()
        with patch.object(settings, "BANK_DATA_ENCRYPTION_KEY", key.decode("ascii")):
            encrypted = encrypt_bank_account_number(account_number)
        self.assertNotEqual(encrypted, account_number)
        self.assertEqual(Fernet(key).decrypt(encrypted.encode("ascii")).decode("ascii"), account_number)

    def test_user_response_schema_has_no_bank_fields(self):
        self.assertNotIn("bank_name", UserOut.model_fields)
        self.assertNotIn("bank_account_number", UserOut.model_fields)
        self.assertNotIn("account_number_encrypted", UserOut.model_fields)

    def test_request_validation_does_not_echo_multipart_body(self):
        submitted_number = "0123456789012345"
        errors = validation_errors_without_input([{
            "loc": ("body", "photo"),
            "msg": "Field required",
            "type": "missing",
            "input": {"bank_account_number": submitted_number},
        }])
        self.assertNotIn(submitted_number, repr(errors))
        self.assertNotIn("input", errors[0])


if __name__ == "__main__":
    unittest.main()
