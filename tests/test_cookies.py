import unittest
from unittest.mock import patch

from fastapi import Response

from app.api import auth as auth_api
from app.schemas.token import TokenPair


class AuthCookiePathTests(unittest.TestCase):
    def _cookies(self, response: Response) -> list[str]:
        return [v.decode() for k, v in response.raw_headers if k == b"set-cookie"]

    def test_refresh_cookie_path_follows_proxy_prefix(self):
        for prefix, expected in (("", "Path=/auth"), ("/api", "Path=/api/auth")):
            with patch.object(auth_api.settings, "API_PATH_PREFIX", prefix):
                response = Response()
                auth_api._set_auth_cookies(response, TokenPair(access_token="a", refresh_token="r"))
                refresh = next(c for c in self._cookies(response) if c.startswith("refresh_token="))
                self.assertIn(expected + ";", refresh + ";")
                self.assertIn("HttpOnly", refresh)

                cleared = Response()
                auth_api._clear_auth_cookies(cleared)
                self.assertTrue(any(c.startswith("refresh_token=") and expected in c for c in self._cookies(cleared)))


if __name__ == "__main__":
    unittest.main()
