"""Shared fixtures for the mocked/isolated test suite (test_auth_oauth.py,
test_payments.py, test_admin_guards.py, test_rate_limit.py).

Unlike the older test_*.py files in this directory — which fire real HTTP
requests at an already-running server via `requests` — these tests import the
FastAPI app directly and drive it in-process via httpx's ASGITransport. No
server needs to be running, and all external calls (Google/Facebook/Apple/
PayPal/Brevo) are mocked, so this suite is safe to run in CI.

Requires a reachable MongoDB (same one used for local dev is fine — this uses
a dedicated "e3c_test" database, never the dev/prod one) and a populated
backend/.env for the secrets core.py requires at import time.
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
# Must be set before `import core` (imported transitively via `import server`),
# which reads DB_NAME at module load time. python-dotenv's load_dotenv() never
# overrides a variable already present in the environment, so this wins over
# whatever DB_NAME is in backend/.env.
os.environ.setdefault("DB_NAME", "e3c_test")

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

import core
import server as server_module
import settings_store


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=server_module.app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture(autouse=True)
async def _isolated_state():
    """Runs around every test: resets the in-memory rate-limit buckets (shared
    across tests since they all hit the app through the same client fixture
    and the ASGI test transport resolves to the same fake remote address) and
    wipes the test database so tests never see another test's leftover data."""
    core.limiter.reset()
    settings_store.invalidate_cache()
    yield
    for name in await core.db.list_collection_names():
        await core.db[name].delete_many({})


@pytest_asyncio.fixture
async def admin_client(client):
    """An AsyncClient pre-authenticated as an admin user via a real /auth
    session (seeds an admin user directly in the DB — bypasses the single
    hardcoded ADMIN_EMAIL/ADMIN_PASSWORD login path already covered elsewhere)."""
    import uuid
    from datetime import datetime, timezone

    uid = str(uuid.uuid4())
    await core.db.users.insert_one(
        {
            "id": uid,
            "email": "test-admin@example.com",
            "password_hash": core.hash_password("Sup3rSecret!"),
            "name": "Test Admin",
            "phone": "",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    token = core.create_access_token(uid, "test-admin@example.com", "admin")
    client.cookies.set("access_token", token)
    return client


@pytest_asyncio.fixture
async def client_user_client(client):
    """An AsyncClient pre-authenticated as an ordinary (non-admin) client user."""
    import uuid
    from datetime import datetime, timezone

    uid = str(uuid.uuid4())
    await core.db.users.insert_one(
        {
            "id": uid,
            "email": "test-client@example.com",
            "password_hash": core.hash_password("Sup3rSecret!"),
            "name": "Test Client",
            "phone": "",
            "role": "client",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    token = core.create_access_token(uid, "test-client@example.com", "client")
    client.cookies.set("access_token", token)
    return client
