import os

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

# Backend API tests for E3C site


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={
        "email": os.environ.get("ADMIN_EMAIL", "admin@e3c-construction.com"),
        "password": os.environ["ADMIN_PASSWORD"],
    })
    assert r.status_code == 200, f"Admin login failed: {r.text}"
    return s


class TestRoot:
    def test_api_root(self):
        r = requests.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        data = r.json()
        assert "message" in data
        assert "E3C" in data["message"]
        print(f"PASS: GET /api/ => {data}")


class TestContact:
    def test_submit_contact(self):
        payload = {
            "name": "TEST_User",
            "phone": "0690123456",
            "commune": "Pointe-à-Pitre",
            "service": "Maçonnerie",
            "message": "Test message",
        }
        r = requests.post(f"{BASE_URL}/api/contact", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == "TEST_User"
        assert data["phone"] == "0690123456"
        assert "id" in data
        print(f"PASS: POST /api/contact => {data['id']}")

    def test_submit_contact_missing_required(self):
        payload = {"name": "TEST_User"}
        r = requests.post(f"{BASE_URL}/api/contact", json=payload)
        assert r.status_code == 422
        print(f"PASS: Missing fields returns 422")

    def test_get_contacts_requires_admin(self):
        r = requests.get(f"{BASE_URL}/api/contact")
        assert r.status_code == 401
        print("PASS: GET /api/contact without auth => 401")

    def test_get_contacts(self, admin_session):
        payload = {
            "name": "TEST_User_list",
            "phone": "0690123456",
            "commune": "Pointe-à-Pitre",
            "service": "Maçonnerie",
            "message": "Test message",
        }
        submitted = requests.post(f"{BASE_URL}/api/contact", json=payload)
        assert submitted.status_code == 200
        submitted_id = submitted.json()["id"]

        r = admin_session.get(f"{BASE_URL}/api/contact")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert any(c["id"] == submitted_id for c in data)
        print(f"PASS: GET /api/contact => {len(data)} contacts")
