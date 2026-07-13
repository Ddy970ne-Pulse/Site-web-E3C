"""Confirms /api/admin/settings and /api/admin/diagnostics reject unauthenticated
and non-admin requests, and behave correctly for a real admin. This is the
panel that controls every payment/integration credential, so its access
control is the single most important guard in the app to keep covered."""
import core
import settings_store


# ─── /api/admin/settings ───────────────────────────────────────────────────

async def test_admin_settings_requires_auth(client):
    r = await client.get("/api/admin/settings")
    assert r.status_code == 401


async def test_admin_settings_rejects_non_admin(client_user_client):
    r = await client_user_client.get("/api/admin/settings")
    assert r.status_code == 403


async def test_admin_settings_readable_by_admin(admin_client):
    r = await admin_client.get("/api/admin/settings")
    assert r.status_code == 200
    data = r.json()
    assert "stripe_api_key" in data
    # Secrets are never returned in plaintext, only a status/preview
    assert "value" not in data["stripe_api_key"]


async def test_admin_settings_update_requires_admin(client_user_client):
    r = await client_user_client.put("/api/admin/settings", json={"google_client_id": "x"})
    assert r.status_code == 403


async def test_admin_settings_update_persists(admin_client):
    r = await admin_client.put("/api/admin/settings", json={"google_client_id": "new-google-id"})
    assert r.status_code == 200
    settings = await settings_store.get_settings(core.db)
    assert settings["google_client_id"] == "new-google-id"


# ─── /api/admin/diagnostics ─────────────────────────────────────────────────

async def test_admin_diagnostics_requires_auth(client):
    r = await client.get("/api/admin/diagnostics")
    assert r.status_code == 401


async def test_admin_diagnostics_rejects_non_admin(client_user_client):
    r = await client_user_client.get("/api/admin/diagnostics")
    assert r.status_code == 403


async def test_admin_diagnostics_readable_by_admin(admin_client):
    r = await admin_client.get("/api/admin/diagnostics")
    assert r.status_code == 200
    data = r.json()
    assert data["checks"]["database"]["status"] == "ok"


async def test_admin_diagnostics_autofix_requires_admin(client_user_client):
    r = await client_user_client.post("/api/admin/diagnostics/auto-fix")
    assert r.status_code == 403


async def test_admin_diagnostics_autofix_by_admin_succeeds(admin_client):
    r = await admin_client.post("/api/admin/diagnostics/auto-fix")
    assert r.status_code == 200
    assert "results" in r.json()
