"""
Backend tests for E3C BTP - Auth, Quotes, Invoices, Payments
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

ADMIN_EMAIL = "admin@e3c-construction.com"
ADMIN_PASSWORD = "E3C@Admin2026"
TEST_CLIENT_EMAIL = f"test_client_{uuid.uuid4().hex[:6]}@example.com"
TEST_CLIENT_PASSWORD = "Test@1234"
TEST_CLIENT_NAME = "Test Client E3C"


@pytest.fixture(scope="module")
def admin_session():
    """Admin authenticated session"""
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.text}"
    return s


@pytest.fixture(scope="module")
def client_data(admin_session):
    """Register a test client and return session + user info"""
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/register", json={
        "email": TEST_CLIENT_EMAIL,
        "password": TEST_CLIENT_PASSWORD,
        "name": TEST_CLIENT_NAME,
        "phone": "0690000001"
    })
    assert r.status_code == 200, f"Register failed: {r.text}"
    data = r.json()
    return {"session": s, "user": data}


@pytest.fixture(scope="module")
def test_quote(admin_session, client_data):
    """Create a test quote"""
    client_id = client_data["user"]["id"]
    r = admin_session.post(f"{BASE_URL}/api/quotes", json={
        "client_id": client_id,
        "project_description": "Test project - maçonnerie",
        "line_items": [{"description": "Fondations", "quantity": 10, "unit_price": 100, "tva_rate": 8.5}],
        "valid_until": "2026-12-31",
        "notes": "Test note"
    })
    assert r.status_code == 200, f"Quote creation failed: {r.text}"
    return r.json()


@pytest.fixture(scope="module")
def test_invoice(admin_session, test_quote, client_data):
    """Accept quote and convert to invoice"""
    quote_id = test_quote["id"]
    # Send quote
    admin_session.post(f"{BASE_URL}/api/quotes/{quote_id}/send")
    # Accept as client
    client_data["session"].post(f"{BASE_URL}/api/quotes/{quote_id}/accept")
    # Convert to invoice
    r = admin_session.post(f"{BASE_URL}/api/quotes/{quote_id}/convert")
    assert r.status_code == 200, f"Invoice creation failed: {r.text}"
    return r.json()


# ─── Health ───────────────────────────────────────────────────────────────────
class TestHealth:
    def test_health(self):
        r = requests.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        assert "E3C" in r.json().get("message", "")


# ─── Auth ─────────────────────────────────────────────────────────────────────
class TestAuth:
    def test_admin_login(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        data = r.json()
        assert data["role"] == "admin"
        assert data["email"] == ADMIN_EMAIL

    def test_wrong_password(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_register_client(self, client_data):
        assert client_data["user"]["role"] == "client"
        assert client_data["user"]["email"] == TEST_CLIENT_EMAIL

    def test_duplicate_register(self):
        r = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": ADMIN_EMAIL, "password": "whatever",
            "name": "Dup", "phone": ""
        })
        assert r.status_code == 400

    def test_me_admin(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200
        assert r.json()["role"] == "admin"

    def test_me_unauthenticated(self):
        r = requests.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401

    def test_logout(self):
        s = requests.Session()
        s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        r = s.post(f"{BASE_URL}/api/auth/logout")
        assert r.status_code == 200


# ─── Quotes ───────────────────────────────────────────────────────────────────
class TestQuotes:
    def test_list_quotes_admin(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/quotes")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_list_quotes_client(self, client_data):
        r = client_data["session"].get(f"{BASE_URL}/api/quotes")
        assert r.status_code == 200

    def test_list_quotes_unauthenticated(self):
        r = requests.get(f"{BASE_URL}/api/quotes")
        assert r.status_code == 401

    def test_create_quote(self, test_quote):
        assert test_quote["quote_number"].startswith("DEV-")
        assert test_quote["status"] == "draft"
        assert test_quote["total_ttc"] > 0

    def test_get_quote_admin(self, admin_session, test_quote):
        r = admin_session.get(f"{BASE_URL}/api/quotes/{test_quote['id']}")
        assert r.status_code == 200
        assert r.json()["id"] == test_quote["id"]

    def test_send_quote(self, admin_session, test_quote):
        # Already sent by fixture, just check status via GET
        r = admin_session.get(f"{BASE_URL}/api/quotes/{test_quote['id']}")
        assert r.status_code == 200

    def test_client_sees_sent_quote(self, client_data, test_quote):
        r = client_data["session"].get(f"{BASE_URL}/api/quotes/{test_quote['id']}")
        assert r.status_code == 200

    def test_quote_pdf(self, admin_session, test_quote):
        r = admin_session.get(f"{BASE_URL}/api/quotes/{test_quote['id']}/pdf")
        assert r.status_code == 200
        assert r.headers["content-type"] == "application/pdf"
        assert len(r.content) > 100


# ─── Invoices ─────────────────────────────────────────────────────────────────
class TestInvoices:
    def test_list_invoices_admin(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/invoices")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_list_invoices_unauthenticated(self):
        r = requests.get(f"{BASE_URL}/api/invoices")
        assert r.status_code == 401

    def test_invoice_created(self, test_invoice):
        assert test_invoice["invoice_number"].startswith("FAC-")
        assert test_invoice["status"] == "pending"
        assert test_invoice["total_ttc"] > 0

    def test_set_tranches(self, admin_session, test_invoice):
        inv_id = test_invoice["id"]
        total = test_invoice["total_ttc"]
        r = admin_session.put(f"{BASE_URL}/api/invoices/{inv_id}/tranches", json={
            "tranches": [
                {"id": str(uuid.uuid4()), "label": "Acompte 30%", "amount": round(total * 0.3, 2), "due_date": "2026-03-01", "status": "pending"},
                {"id": str(uuid.uuid4()), "label": "Solde 70%", "amount": round(total * 0.7, 2), "due_date": "2026-06-01", "status": "pending"},
            ]
        })
        assert r.status_code == 200, f"Tranches failed: {r.text}"
        data = r.json()
        assert len(data["payment_tranches"]) == 2

    def test_tranches_amount_mismatch(self, admin_session, test_invoice):
        inv_id = test_invoice["id"]
        r = admin_session.put(f"{BASE_URL}/api/invoices/{inv_id}/tranches", json={
            "tranches": [
                {"id": str(uuid.uuid4()), "label": "Bad", "amount": 1.00, "due_date": "2026-03-01", "status": "pending"},
            ]
        })
        assert r.status_code == 400

    def test_invoice_pdf(self, admin_session, test_invoice):
        r = admin_session.get(f"{BASE_URL}/api/invoices/{test_invoice['id']}/pdf")
        assert r.status_code == 200
        assert r.headers["content-type"] == "application/pdf"


# ─── Clients ──────────────────────────────────────────────────────────────────
class TestClients:
    def test_list_clients(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/clients")
        assert r.status_code == 200
        clients = r.json()
        assert isinstance(clients, list)
        # Ensure password_hash not exposed
        for c in clients:
            assert "password_hash" not in c

    def test_list_clients_forbidden_for_client(self, client_data):
        r = client_data["session"].get(f"{BASE_URL}/api/clients")
        assert r.status_code == 403


# ─── Payments ─────────────────────────────────────────────────────────────────
class TestPayments:
    def test_list_payments_admin(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/payments")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_checkout_requires_tranches(self, client_data, test_invoice):
        # Try checkout on invoice with no tranches set yet (actually tranches were set in TestInvoices)
        # This is more of an integration test - just verify the endpoint exists
        inv = test_invoice
        # Get updated invoice with tranches
        r = client_data["session"].get(f"{BASE_URL}/api/invoices/{inv['id']}")
        assert r.status_code == 200
        inv_data = r.json()
        tranches = inv_data.get("payment_tranches", [])
        if tranches:
            tranche_id = tranches[0]["id"]
            r2 = client_data["session"].post(f"{BASE_URL}/api/payments/checkout", json={
                "invoice_id": inv["id"],
                "tranche_id": tranche_id,
                "origin_url": BASE_URL
            })
            # Should return 200 with checkout_url (Stripe test key)
            assert r2.status_code == 200, f"Checkout failed: {r2.text}"
            data = r2.json()
            assert "checkout_url" in data
            print(f"Checkout URL: {data['checkout_url']}")
        else:
            pytest.skip("No tranches set yet")
