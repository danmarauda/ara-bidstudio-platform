from __future__ import annotations

import sys
import types
import unittest
from unittest.mock import MagicMock, patch

from opencontractserver.utils.cloud import maybe_add_cloud_run_auth


def _stub_google_modules(
    token: str | None = "test-token", raise_on_fetch: bool = False
) -> dict[str, types.ModuleType]:
    """
    Build a set of stub `google.*` modules so the helpers can import and use them
    without requiring the real Google libraries at test time.
    """
    google = types.ModuleType("google")
    auth = types.ModuleType("google.auth")
    transport = types.ModuleType("google.auth.transport")
    requests_mod = types.ModuleType("google.auth.transport.requests")
    oauth2 = types.ModuleType("google.oauth2")
    id_token_mod = types.ModuleType("google.oauth2.id_token")

    # Mark parent modules as packages so submodule imports succeed
    google.__path__ = []  # type: ignore[attr-defined]
    auth.__path__ = []  # type: ignore[attr-defined]
    transport.__path__ = []  # type: ignore[attr-defined]
    oauth2.__path__ = []  # type: ignore[attr-defined]

    # Link parent-child attributes to mirror real module structure
    google.auth = auth  # type: ignore[attr-defined]
    google.oauth2 = oauth2  # type: ignore[attr-defined]
    auth.transport = transport  # type: ignore[attr-defined]
    transport.requests = requests_mod  # type: ignore[attr-defined]
    oauth2.id_token = id_token_mod  # type: ignore[attr-defined]

    # Request object mocked out
    requests_mod.Request = MagicMock(return_value=MagicMock())

    if raise_on_fetch:

        def _fetch_id_token(*_: object, **__: object) -> str:
            raise RuntimeError("fetch_id_token failure for testing")

    else:

        def _fetch_id_token(*_: object, **__: object) -> str | None:
            return token

    id_token_mod.fetch_id_token = MagicMock(side_effect=_fetch_id_token)

    return {
        "google": google,
        "google.auth": auth,
        "google.auth.transport": transport,
        "google.auth.transport.requests": requests_mod,
        "google.oauth2": oauth2,
        "google.oauth2.id_token": id_token_mod,
    }


class TestCloudRunAuthHelper(unittest.TestCase):
    """Coverage for `maybe_add_cloud_run_auth`."""

    def test_noop_for_non_cloud_run_without_force(self) -> None:
        """Headers should be unchanged when URL is not Cloud Run and force is False."""
        headers = {"X-API-Key": "k"}
        out = maybe_add_cloud_run_auth("https://example.com/api", headers, force=False)
        self.assertIs(out, headers)
        self.assertNotIn("Authorization", out)

    def test_attaches_token_for_cloud_run(self) -> None:
        """Authorization must be added for *.run.app endpoints."""
        with patch.dict(sys.modules, _stub_google_modules(token="abc123"), clear=False):
            headers: dict[str, str] = {}
            out = maybe_add_cloud_run_auth("https://svc-xyz-uc.a.run.app", headers)
            self.assertEqual(out.get("Authorization"), "Bearer abc123")

    def test_force_true_on_custom_domain(self) -> None:
        """Forced mode should attach token even for non-Cloud-Run domains."""
        with patch.dict(sys.modules, _stub_google_modules(token="zzz"), clear=False):
            headers: dict[str, str] = {}
            out = maybe_add_cloud_run_auth(
                "https://custom.example.com", headers, force=True
            )
            self.assertEqual(out.get("Authorization"), "Bearer zzz")

    def test_token_none_does_not_add_header(self) -> None:
        """If token acquisition returns None, Authorization is not added."""
        with patch.dict(sys.modules, _stub_google_modules(token=None), clear=False):
            headers: dict[str, str] = {}
            out = maybe_add_cloud_run_auth("https://svc-xyz-uc.a.run.app", headers)
            self.assertNotIn("Authorization", out)

    def test_exception_path_returns_original_headers(self) -> None:
        """Exceptions during token fetch should be handled and headers returned unchanged."""
        with patch.dict(
            sys.modules, _stub_google_modules(raise_on_fetch=True), clear=False
        ):
            headers: dict[str, str] = {"X-API-Key": "k"}
            out = maybe_add_cloud_run_auth("https://svc-xyz-uc.a.run.app", headers)
            self.assertIs(out, headers)
            self.assertNotIn("Authorization", out)
