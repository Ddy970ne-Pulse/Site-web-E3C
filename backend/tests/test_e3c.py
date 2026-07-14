import os

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

# Backend API tests for E3C site


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

    def test_get_contacts(self):
        r = requests.get(f"{BASE_URL}/api/contact")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/contact => {len(data)} contacts")
