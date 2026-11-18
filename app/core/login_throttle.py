"""Per-account sign-in throttle.

The IP-based limits can be dodged (or shared by everyone behind one proxy), so
repeated wrong passwords for one email address are also counted here, whichever
IP they come from. After LOGIN_MAX_FAILURES wrong attempts inside the window, that
address is refused until the oldest failure ages out. Unknown addresses are counted
the same way, so the throttle reveals nothing about which accounts exist.

State is in memory, which is right for the single API instance Render runs; with
several instances each would keep its own count (the limit is then per instance).
"""
import time
from collections import deque

from app.core.config import settings

_MAX_TRACKED = 10_000
_failures: dict[str, deque[float]] = {}


def _window() -> float:
    return settings.LOGIN_LOCKOUT_MINUTES * 60.0


def _fresh(key: str, now: float) -> deque[float]:
    attempts = _failures.get(key)
    if attempts is None:
        return deque()
    while attempts and now - attempts[0] > _window():
        attempts.popleft()
    if not attempts:
        _failures.pop(key, None)
    return attempts


def retry_after_seconds(email: str) -> int:
    """0 if sign-in is allowed, otherwise how many seconds until it is."""
    now = time.monotonic()
    attempts = _fresh(email.strip().lower(), now)
    if len(attempts) < settings.LOGIN_MAX_FAILURES:
        return 0
    return max(1, int(_window() - (now - attempts[0])) + 1)


def record_failure(email: str) -> None:
    now = time.monotonic()
    key = email.strip().lower()
    if len(_failures) >= _MAX_TRACKED and key not in _failures:
        for stale in [k for k in _failures if not _fresh(k, now)]:
            _failures.pop(stale, None)
        if len(_failures) >= _MAX_TRACKED:  # still full of live entries: drop the oldest
            _failures.pop(next(iter(_failures)), None)
    attempts = _fresh(key, now)
    attempts.append(now)
    _failures[key] = attempts


def reset(email: str) -> None:
    _failures.pop(email.strip().lower(), None)
