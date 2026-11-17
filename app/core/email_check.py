"""Registration-time check that an email address can actually receive mail.

The one-time code sent by /auth/register is what proves the person owns the inbox; this check
stops obviously fake addresses (made-up domains, domains that refuse mail, throwaway inboxes)
before an account row is created at all.
"""
import asyncio
import logging

from email_validator import EmailNotValidError, EmailUndeliverableError, validate_email

logger = logging.getLogger(__name__)

DNS_TIMEOUT_SECONDS = 5

# Well-known throwaway-inbox services. Not exhaustive; the emailed code is still the real check.
DISPOSABLE_DOMAINS = frozenset({
    "mailinator.com", "guerrillamail.com", "guerrillamail.net", "sharklasers.com", "10minutemail.com",
    "temp-mail.org", "tempmail.com", "yopmail.com", "trashmail.com", "getnada.com", "dispostable.com",
    "maildrop.cc", "throwawaymail.com", "fakeinbox.com", "mailnesia.com", "emailondeck.com",
})


def _domain_accepts_mail(email: str) -> bool:
    try:
        validate_email(email, check_deliverability=True, timeout=DNS_TIMEOUT_SECONDS)
    except EmailUndeliverableError:
        return False  # domain does not exist, or publishes no mail server / a null MX
    except EmailNotValidError:
        return False
    except Exception as exc:  # DNS trouble on our side must not block real people; the OTP still guards
        logger.warning("Email deliverability check skipped (%s)", type(exc).__name__)
    return True


async def email_can_receive_mail(email: str) -> bool:
    domain = email.rsplit("@", 1)[-1].lower()
    if domain in DISPOSABLE_DOMAINS:
        return False
    return await asyncio.to_thread(_domain_accepts_mail, email)
