"""
Tests for P1 (quote-to-invoice), P2 (deposit presets), and PDF generation
"""

import os

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

SESSION = requests.Session()


@pytest.fixture(scope="module", autouse=True)
def login():
    # Read from the environment rather than hardcoding — this used to be the
    # actual literal default password, which was leaked via source control
    # and is now permanently blocked by server.py's require_env() at startup.
    resp = SESSION.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "email": os.environ.get("ADMIN_EMAIL", "admin@e3c-construction.com"),
            "password": os.environ["ADMIN_PASSWORD"],
        },
    )
    assert resp.status_code == 200, f"Login failed: {resp.text}"


# ── P1: Quote-request to invoice ──────────────────────────────────────────────


def _create_quote_request(suffix):
    """Creates a fresh quote request via the public endpoint so tests don't
    depend on hardcoded IDs from old seed data."""
    resp = SESSION.post(
        f"{BASE_URL}/api/quote-requests",
        json={
            "project_type": "Rénovation",
            "services": ["Maçonnerie"],
            "description": f"Test quote request {suffix}",
            "commune": "Pointe-à-Pitre",
            "name": f"TEST_QuoteRequest_{suffix}",
            "email": f"test_qr_{suffix}@example.com",
        },
    )
    assert resp.status_code == 200, f"Quote request creation failed: {resp.text}"
    return resp.json()["id"]


class TestQuoteToInvoice:
    """P1 - Convert quote request to invoice"""

    @pytest.fixture(scope="class")
    def unconverted_id(self):
        return _create_quote_request("unconverted")

    @pytest.fixture(scope="class")
    def already_converted_id(self):
        req_id = _create_quote_request("already_converted")
        resp = SESSION.post(f"{BASE_URL}/api/quote-requests/{req_id}/to-invoice")
        assert resp.status_code == 200, f"Initial conversion failed: {resp.text}"
        return req_id

    def test_convert_quote_request_creates_invoice(self, unconverted_id):
        resp = SESSION.post(
            f"{BASE_URL}/api/quote-requests/{unconverted_id}/to-invoice"
        )
        assert (
            resp.status_code == 200
        ), f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        # Check invoice fields
        assert "id" in data
        assert data.get("invoice_number", "").startswith("FAC-")
        assert data.get("status") == "pending"
        assert "total_ttc" in data
        assert isinstance(data.get("payment_tranches", []), list)
        print(f"Created invoice: {data.get('invoice_number')} id={data.get('id')}")

    def test_convert_already_converted_returns_400(self, already_converted_id):
        resp = SESSION.post(
            f"{BASE_URL}/api/quote-requests/{already_converted_id}/to-invoice"
        )
        assert (
            resp.status_code == 400
        ), f"Expected 400 for already-converted, got {resp.status_code}: {resp.text}"

    def test_converted_request_has_status_converted(self, already_converted_id):
        resp = SESSION.get(f"{BASE_URL}/api/quote-requests")
        assert resp.status_code == 200
        requests_list = resp.json()
        converted = next(
            (r for r in requests_list if r["id"] == already_converted_id), None
        )
        assert converted is not None
        assert converted.get("status") == "converted"


# ── PDF Generation ─────────────────────────────────────────────────────────────


class TestPDFGeneration:
    """PDF endpoints return valid PDF files"""

    @pytest.fixture(scope="class")
    def invoice_id(self):
        req_id = _create_quote_request("pdf")
        resp = SESSION.post(f"{BASE_URL}/api/quote-requests/{req_id}/to-invoice")
        assert resp.status_code == 200, f"Invoice creation failed: {resp.text}"
        return resp.json()["id"]

    def test_invoice_pdf_returns_valid(self, invoice_id):
        resp = SESSION.get(f"{BASE_URL}/api/invoices/{invoice_id}/pdf")
        assert (
            resp.status_code == 200
        ), f"Expected 200, got {resp.status_code}: {resp.text[:200]}"
        assert "application/pdf" in resp.headers.get(
            "content-type", ""
        ), f"Wrong content-type: {resp.headers.get('content-type')}"
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
        assert (
            pdf_resp.status_code == 200
        ), f"Expected 200, got {pdf_resp.status_code}: {pdf_resp.text[:200]}"
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
