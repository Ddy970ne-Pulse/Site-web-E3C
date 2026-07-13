"""Google / Facebook / Apple sign-in, with the external verification calls
mocked (no real network access, no real Google/Facebook/Apple credentials
needed to run this suite)."""
import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import httpx
import pytest

import core
import settings_store
from routers import auth_routes


class _FakeResponse:
    def __init__(self, json_data, status_code=200):
        self._json = json_data
        self.status_code = status_code

    def json(self):
        return self._json

    def raise_for_status(self):
        if self.status_code >= 400:
            raise httpx.HTTPStatusError("error", request=None, response=self)


class _FakeAsyncClient:
    """Stands in for httpx.AsyncClient(...) inside a `async with` block; routes
    .get() calls to a canned response based on a substring match on the URL."""

    def __init__(self, responses_by_url_substring):
        self._responses = responses_by_url_substring

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    async def get(self, url, params=None, **kwargs):
        for substring, response in self._responses.items():
            if substring in url:
                return response
        raise AssertionError(f"Unexpected URL requested in test: {url}")


async def _seed_admin(db, email):
    await db.users.insert_one({
        "id": str(uuid.uuid4()), "email": email,
        "password_hash": core.hash_password("whatever-not-used"),
        "name": "Existing Admin", "phone": "", "role": "admin",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })


# ─── Google ─────────────────────────────────────────────────────────────

async def test_google_login_unconfigured_returns_503(client):
    r = await client.post("/api/auth/google", json={"credential": "fake"})
    assert r.status_code == 503


async def test_google_login_creates_new_user(client):
    await settings_store.update_settings(core.db, {"google_client_id": "test-google-client-id"})
    fake_idinfo = {"email": "newuser@example.com", "email_verified": True,
                   "name": "New User", "sub": "google-sub-123"}
    with patch.object(auth_routes.google_id_token, "verify_oauth2_token", return_value=fake_idinfo):
        r = await client.post("/api/auth/google", json={"credential": "fake-credential"})
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == "newuser@example.com"
    assert data["role"] == "client"
    user = await core.db.users.find_one({"email": "newuser@example.com"})
    assert user["google_id"] == "google-sub-123"


async def test_google_login_rejects_invalid_token(client):
    await settings_store.update_settings(core.db, {"google_client_id": "test-google-client-id"})
    with patch.object(auth_routes.google_id_token, "verify_oauth2_token",
                       side_effect=ValueError("bad token")):
        r = await client.post("/api/auth/google", json={"credential": "garbage"})
    assert r.status_code == 401


async def test_google_login_rejects_unverified_email(client):
    await settings_store.update_settings(core.db, {"google_client_id": "test-google-client-id"})
    fake_idinfo = {"email": "x@example.com", "email_verified": False, "sub": "s"}
    with patch.object(auth_routes.google_id_token, "verify_oauth2_token", return_value=fake_idinfo):
        r = await client.post("/api/auth/google", json={"credential": "fake"})
    assert r.status_code == 401


async def test_google_login_blocked_for_admin_accounts(client):
    await settings_store.update_settings(core.db, {"google_client_id": "test-google-client-id"})
    await _seed_admin(core.db, "admin-target@example.com")
    fake_idinfo = {"email": "admin-target@example.com", "email_verified": True,
                   "sub": "s", "name": "Admin"}
    with patch.object(auth_routes.google_id_token, "verify_oauth2_token", return_value=fake_idinfo):
        r = await client.post("/api/auth/google", json={"credential": "fake"})
    assert r.status_code == 403


# ─── Facebook ───────────────────────────────────────────────────────────

async def test_facebook_login_creates_new_user(client):
    await settings_store.update_settings(core.db, {
        "facebook_app_id": "fb-app-id", "facebook_app_secret": "fb-app-secret",
    })
    fake_client = _FakeAsyncClient({
        "debug_token": _FakeResponse({"data": {"is_valid": True, "app_id": "fb-app-id"}}),
        "/me": _FakeResponse({"id": "fb-123", "name": "FB User", "email": "fbuser@example.com"}),
    })
    with patch("routers.auth_routes.httpx.AsyncClient", return_value=fake_client):
        r = await client.post("/api/auth/facebook", json={"access_token": "tok"})
    assert r.status_code == 200
    assert r.json()["email"] == "fbuser@example.com"


async def test_facebook_login_rejects_token_for_wrong_app(client):
    await settings_store.update_settings(core.db, {
        "facebook_app_id": "fb-app-id", "facebook_app_secret": "fb-app-secret",
    })
    fake_client = _FakeAsyncClient({
        "debug_token": _FakeResponse({"data": {"is_valid": True, "app_id": "some-other-app"}}),
    })
    with patch("routers.auth_routes.httpx.AsyncClient", return_value=fake_client):
        r = await client.post("/api/auth/facebook", json={"access_token": "tok"})
    assert r.status_code == 401


async def test_facebook_login_rejects_missing_email(client):
    await settings_store.update_settings(core.db, {
        "facebook_app_id": "fb-app-id", "facebook_app_secret": "fb-app-secret",
    })
    fake_client = _FakeAsyncClient({
        "debug_token": _FakeResponse({"data": {"is_valid": True, "app_id": "fb-app-id"}}),
        "/me": _FakeResponse({"id": "fb-123", "name": "No Email User"}),
    })
    with patch("routers.auth_routes.httpx.AsyncClient", return_value=fake_client):
        r = await client.post("/api/auth/facebook", json={"access_token": "tok"})
    assert r.status_code == 401


# ─── Apple ──────────────────────────────────────────────────────────────

def _apple_mocks(payload):
    fake_key = MagicMock()
    fake_key.key = "fake-key-material"
    fake_jwks_client = MagicMock()
    fake_jwks_client.get_signing_key_from_jwt = MagicMock(return_value=fake_key)
    return (
        patch("routers.auth_routes._get_apple_jwks_client", return_value=fake_jwks_client),
        patch.object(auth_routes.jwt, "decode", return_value=payload),
    )


async def test_apple_login_creates_new_user(client):
    await settings_store.update_settings(core.db, {"apple_client_id": "apple-client-id"})
    payload = {"email": "appleuser@example.com", "email_verified": "true", "sub": "apple-sub-1"}
    p1, p2 = _apple_mocks(payload)
    with p1, p2:
        r = await client.post("/api/auth/apple", json={"id_token": "fake-jwt", "name": "Apple User"})
    assert r.status_code == 200
    assert r.json()["email"] == "appleuser@example.com"


async def test_apple_login_rejects_invalid_token(client):
    await settings_store.update_settings(core.db, {"apple_client_id": "apple-client-id"})
    fake_jwks_client = MagicMock()
    fake_jwks_client.get_signing_key_from_jwt = MagicMock(
        side_effect=auth_routes.jwt.PyJWTError("bad key"))
    with patch("routers.auth_routes._get_apple_jwks_client", return_value=fake_jwks_client):
        r = await client.post("/api/auth/apple", json={"id_token": "garbage"})
    assert r.status_code == 401


async def test_apple_login_rejects_unverified_email(client):
    await settings_store.update_settings(core.db, {"apple_client_id": "apple-client-id"})
    payload = {"email": "x@example.com", "email_verified": "false", "sub": "s"}
    p1, p2 = _apple_mocks(payload)
    with p1, p2:
        r = await client.post("/api/auth/apple", json={"id_token": "fake-jwt"})
    assert r.status_code == 401


# ─── Shared provider-listing endpoint ────────────────────────────────────

async def test_auth_providers_reflects_configured_settings(client):
    await settings_store.update_settings(core.db, {"google_client_id": "gid", "facebook_app_id": "fid"})
    r = await client.get("/api/auth/providers")
    assert r.status_code == 200
    data = r.json()
    assert data["google_client_id"] == "gid"
    assert data["facebook_app_id"] == "fid"
    assert data["apple_client_id"] == ""
