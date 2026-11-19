import ipaddress

from fastapi import Request

from app.core.config import settings


def client_ip(request: Request) -> str:
    """The address per-IP rate limits are counted against.

    On Render every request passes through Cloudflare, which overwrites `CF-Connecting-IP` with the
    visitor's real address (checked on the live service: same value through the static site and
    when calling the API directly). `X-Forwarded-For` is NOT used: its first entry is whatever the
    visitor sent, so trusting it lets anyone dodge a limit by changing a header.

    Anything that is not a valid IP address, or no header at all (local development, Render's own
    health check), falls back to the address of the TCP connection.
    """
    header = settings.CLIENT_IP_HEADER
    if header:
        value = request.headers.get(header, "").strip()
        if value:
            try:
                return str(ipaddress.ip_address(value))
            except ValueError:
                pass
    return request.client.host if request.client else "unknown"
