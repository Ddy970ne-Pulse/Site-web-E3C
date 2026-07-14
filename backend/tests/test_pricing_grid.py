"""Backend tests for Pricing Grid and DevisWizard submission features"""

import os

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

# Read from the environment rather than hardcoding — this used to be the
# actual literal default password, which was leaked via source control and
# is now permanently blocked by server.py's require_env() at startup.
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@e3c-construction.com")
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]


@pytest.fixture(scope="module")
def admin_session():
    session = requests.Session()
    resp = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    )
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return session


# --- GET /api/pricing-grid (public) ---
def test_get_pricing_grid_public():
    resp = requests.get(f"{BASE_URL}/api/pricing-grid")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    print(f"PASS: GET /api/pricing-grid returns {len(data)} items")


# --- POST /api/pricing-grid (admin) ---
def test_post_pricing_grid(admin_session):
    payload = {
        "category": "TEST_Maçonnerie",
        "description": "TEST_Mur en agglos 20cm",
        "unit": "m²",
        "unit_price_ht": 95.0,
        "tva_rate": 10.0,
        "active": True,
    }
    resp = admin_session.post(f"{BASE_URL}/api/pricing-grid", json=payload)
    assert resp.status_code == 200, f"POST failed: {resp.text}"
    data = resp.json()
    assert data["category"] == payload["category"]
    assert data["description"] == payload["description"]
    assert data["unit_price_ht"] == 95.0
    assert "id" in data
    print(f"PASS: POST /api/pricing-grid created id={data['id']}")
    return data["id"]


@pytest.fixture(scope="module")
def created_item_id(admin_session):
    payload = {
        "category": "TEST_Toiture",
        "description": "TEST_Couverture ardoise",
        "unit": "m²",
        "unit_price_ht": 120.0,
        "tva_rate": 20.0,
        "active": True,
    }
    resp = admin_session.post(f"{BASE_URL}/api/pricing-grid", json=payload)
    assert resp.status_code == 200
    item_id = resp.json()["id"]
    yield item_id
    # cleanup
    admin_session.delete(f"{BASE_URL}/api/pricing-grid/{item_id}")


def test_item_visible_in_list(admin_session, created_item_id):
    resp = requests.get(f"{BASE_URL}/api/pricing-grid")
    assert resp.status_code == 200
    ids = [i["id"] for i in resp.json()]
    assert created_item_id in ids
    print(f"PASS: created item {created_item_id} visible in list")


def test_put_pricing_grid(admin_session, created_item_id):
    update = {"unit_price_ht": 130.0, "description": "TEST_Couverture ardoise updated"}
    resp = admin_session.put(
        f"{BASE_URL}/api/pricing-grid/{created_item_id}", json=update
    )
    assert resp.status_code == 200, f"PUT failed: {resp.text}"
    data = resp.json()
    assert data["unit_price_ht"] == 130.0
    assert data["description"] == "TEST_Couverture ardoise updated"
    print(f"PASS: PUT /api/pricing-grid/{created_item_id}")


def test_toggle_active_false(admin_session, created_item_id):
    resp = admin_session.put(
        f"{BASE_URL}/api/pricing-grid/{created_item_id}", json={"active": False}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["active"] == False
    print(f"PASS: Toggle active=False for {created_item_id}")


def test_toggle_active_true(admin_session, created_item_id):
    resp = admin_session.put(
        f"{BASE_URL}/api/pricing-grid/{created_item_id}", json={"active": True}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["active"] == True
    print(f"PASS: Toggle active=True for {created_item_id}")


def test_delete_pricing_grid(admin_session):
    # Create temp item to delete
    payload = {
        "category": "TEST_Delete",
        "description": "TEST_To be deleted",
        "unit": "u",
        "unit_price_ht": 10.0,
        "tva_rate": 20.0,
        "active": True,
    }
    resp = admin_session.post(f"{BASE_URL}/api/pricing-grid", json=payload)
    assert resp.status_code == 200
    item_id = resp.json()["id"]

    del_resp = admin_session.delete(f"{BASE_URL}/api/pricing-grid/{item_id}")
    assert del_resp.status_code == 200, f"DELETE failed: {del_resp.text}"

    # Verify removed
    items = requests.get(f"{BASE_URL}/api/pricing-grid").json()
    ids = [i["id"] for i in items]
    assert item_id not in ids
    print(f"PASS: DELETE /api/pricing-grid/{item_id}")


def test_post_quote_with_line_items():
    """Test DevisWizard submission with line_items and estimated totals"""
    payload = {
        "project_type": "Rénovation",
        "services": ["Maçonnerie"],
        "description": "Test project with line items",
        "commune": "Paris",
        "name": "TEST_Jean Dupont",
        "email": "test_devis@example.com",
        "phone": "0612345678",
        "address": "12 rue des Tests",
        "line_items": [
            {
                "pricing_item_id": "test-id-1",
                "description": "Mur en agglos 15cm",
                "unit": "m²",
                "unit_price_ht": 85.0,
                "tva_rate": 10.0,
                "quantity": 5,
            }
        ],
        "estimated_total_ht": 425.0,
        "estimated_total_ttc": 467.5,
    }
    resp = requests.post(f"{BASE_URL}/api/quote-requests", json=payload)
    assert resp.status_code == 200, f"POST /api/quote-requests failed: {resp.text}"
    data = resp.json()
    assert "id" in data
    print(f"PASS: POST /api/quote-requests with line_items, id={data['id']}")


def test_post_requires_admin(admin_session):
    """POST without auth should fail"""
    payload = {
        "category": "Test",
        "description": "Test",
        "unit": "u",
        "unit_price_ht": 10.0,
        "tva_rate": 20.0,
    }
    resp = requests.post(f"{BASE_URL}/api/pricing-grid", json=payload)
    assert resp.status_code in [
        401,
        403,
    ], f"Expected auth required, got {resp.status_code}"
    print(f"PASS: POST /api/pricing-grid requires auth")
