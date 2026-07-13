"""
Tests for P1 (quote-to-invoice), P2 (deposit presets), and PDF generation
"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

SESSION = requests.Session()

@pytest.fixture(scope="module", autouse=True)
def login():
    # Read from the environment rather than hardcoding — this used to be the
    # actual literal default password, which was leaked via source control
    # and is now permanently blocked by server.py's require_env() at startup.
    resp = SESSION.post(f"{BASE_URL}/api/auth/login", json={
        "email": os.environ.get("ADMIN_EMAIL", "admin@e3c-construction.com"),
        "password": os.environ["ADMIN_PASSWORD"],
    })
    assert resp.status_code == 200, f"Login failed: {resp.text}"


# ── P1: Quote-request to invoice ──────────────────────────────────────────────

class TestQuoteToInvoice:
    """P1 - Convert quote request to invoice"""

    UNCONVERTED_ID = "3e49b009-5974-4c61-ad9f-1a626de286a5"
    ALREADY_CONVERTED_ID = "1379a97b-123c-447e-88c2-cfa3ba79e654"

    def test_convert_quote_request_creates_invoice(self):
        resp = SESSION.post(f"{BASE_URL}/api/quote-requests/{self.UNCONVERTED_ID}/to-invoice")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        # Check invoice fields
        assert "id" in data
        assert data.get("invoice_number", "").startswith("FAC-")
        assert data.get("status") == "pending"
        assert "total_ttc" in data
        assert isinstance(data.get("payment_tranches", []), list)
        print(f"Created invoice: {data.get('invoice_number')} id={data.get('id')}")

    def test_convert_already_converted_returns_400(self):
        resp = SESSION.post(f"{BASE_URL}/api/quote-requests/{self.ALREADY_CONVERTED_ID}/to-invoice")
        assert resp.status_code == 400, f"Expected 400 for already-converted, got {resp.status_code}: {resp.text}"

    def test_converted_request_has_status_converted(self):
        resp = SESSION.get(f"{BASE_URL}/api/quote-requests")
        assert resp.status_code == 200
        requests_list = resp.json()
        converted = next((r for r in requests_list if r["id"] == self.ALREADY_CONVERTED_ID), None)
        assert converted is not None
        assert converted.get("status") == "converted"


# ── PDF Generation ─────────────────────────────────────────────────────────────

class TestPDFGeneration:
    """PDF endpoints return valid PDF files"""

    INVOICE_ID = "32126de4-a081-42ee-8649-c0f8a70792f9"  # FAC-2026-001

    def test_invoice_pdf_returns_valid(self):
        resp = SESSION.get(f"{BASE_URL}/api/invoices/{self.INVOICE_ID}/pdf")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:200]}"
        assert "application/pdf" in resp.headers.get("content-type", ""), f"Wrong content-type: {resp.headers.get('content-type')}"
        assert resp.content[:4] == b"%PDF", "Content does not start with %PDF"

    def test_quote_pdf_returns_valid(self):
        # Get first available quote
        resp = SESSION.get(f"{BASE_URL}/api/quotes")
        assert resp.status_code == 200
        quotes = resp.json()
        if not quotes:
            pytest.skip("No quotes available")
        quote_id = quotes[0]["id"]
        pdf_resp = SESSION.get(f"{BASE_URL}/api/quotes/{quote_id}/pdf")
        assert pdf_resp.status_code == 200, f"Expected 200, got {pdf_resp.status_code}: {pdf_resp.text[:200]}"
        assert "application/pdf" in pdf_resp.headers.get("content-type", "")
        assert pdf_resp.content[:4] == b"%PDF"


# ── Invoice list sanity ────────────────────────────────────────────────────────

class TestInvoiceList:
    def test_invoices_list_has_fac_2026(self):
        resp = SESSION.get(f"{BASE_URL}/api/invoices")
        assert resp.status_code == 200
        invoices = resp.json()
        numbers = [i.get("invoice_number") for i in invoices]
        print("Invoice numbers:", numbers)
        assert any(n and n.startswith("FAC-2026") for n in numbers)
