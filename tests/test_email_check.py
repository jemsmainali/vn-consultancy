import asyncio
import unittest
from unittest.mock import patch

from email_validator import EmailUndeliverableError

from app.core import email_check


class EmailCheckTests(unittest.TestCase):
    def check(self, email):
        return asyncio.run(email_check.email_can_receive_mail(email))

    def test_disposable_domain_is_rejected_without_dns(self):
        with patch.object(email_check, "validate_email") as dns:
            self.assertFalse(self.check("someone@Mailinator.com"))
            dns.assert_not_called()

    def test_domain_without_mail_server_is_rejected(self):
        with patch.object(email_check, "validate_email", side_effect=EmailUndeliverableError("no MX")):
            self.assertFalse(self.check("someone@made-up-domain.test"))

    def test_deliverable_domain_is_accepted(self):
        with patch.object(email_check, "validate_email") as dns:
            self.assertTrue(self.check("someone@gmail.com"))
            dns.assert_called_once()
            self.assertTrue(dns.call_args.kwargs["check_deliverability"])

    def test_our_own_dns_failure_does_not_block_signup(self):
        with patch.object(email_check, "validate_email", side_effect=OSError("network down")):
            self.assertTrue(self.check("someone@gmail.com"))


if __name__ == "__main__":
    unittest.main()
