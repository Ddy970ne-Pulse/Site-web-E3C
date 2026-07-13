"""PayPal checkout (mocked PayPal REST calls) and manual bank-transfer
mark-paid, including the admin guard on the latter."""
import uuid
from datetime import datetime, timezone
from unittest.mock import patch

import httpx
import pytest

import core
import settings_store
from routers import payments_routes


async def _seed_invoice_with_tranche(db, *, tranche_status="pending", amount=100.0):
    client_uid = str(uuid.uuid4())
    await db.users.insert_one({
        "id": client_uid, "email": "payer@example.com",
        "password_hash": core.hash_password("pw"),
        "name": "Payer", "phone": "", "role": "client",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    invoice_id = str(uuid.uuid4())
    tranche_id = str(uuid.uuid4())
    await db.invoices.insert_one({
        "id": invoice_id, "client_id": client_uid, "client_name": "Payer",
        "invoice_number": "FAC-2026-999", "total_ttc": amount,
        "payment_tranches": [
            {"id": tranche_id, "amount": amount, "status": tranche_status, "label": "Acompte"}
        ],
    })
    token = core.create_access_token(client_uid, "payer@example.com", "client")
    return client_uid, invoice_id, tranche_id, token


# ─── PayPal create-order ──────────────────────────────────────────────────

async def test_paypal_create_order_success(client):
    _, invoice_id, tranche_id, token = await _seed_invoice_with_tranche(core.db)
    client.cookies.set("access_token", token)
    await settings_store.update_settings(core.db, {
        "paypal_client_id": "pp-id", "paypal_client_secret": "pp-secret", "paypal_mode": "sandbox",
    })
    fake_order = {"order_id": "PAYPAL-ORDER-1", "approve_url": "https://paypal.example/approve"}
    with patch.object(payments_routes.paypal, "create_order", return_value=fake_order) as mock_create:
        r = await client.post("/api/payments/paypal/create-order", json={
            "invoice_id": invoice_id, "tranche_id": tranche_id, "origin_url": "http://localhost:3000",
        })
    assert r.status_code == 200
    assert r.json() == {"approve_url": "https://paypal.example/approve", "order_id": "PAYPAL-ORDER-1"}
    mock_create.assert_called_once()
    _, kwargs = mock_create.call_args
    assert kwargs["amount"] == 100.0
    tx = await core.db.payment_transactions.find_one({"session_id": "PAYPAL-ORDER-1"})
    assert tx["payment_status"] == "pending"
    assert tx["payment_method"] == "paypal"


async def test_paypal_create_order_requires_auth(client):
    _, invoice_id, tranche_id, _ = await _seed_invoice_with_tranche(core.db)
    r = await client.post("/api/payments/paypal/create-order", json={
        "invoice_id": invoice_id, "tranche_id": tranche_id, "origin_url": "http://localhost:3000",
    })
    assert r.status_code == 401


async def test_paypal_create_order_blocks_other_clients_invoice(client):
    _, invoice_id, tranche_id, _ = await _seed_invoice_with_tranche(core.db)
    other_uid = str(uuid.uuid4())
    await core.db.users.insert_one({
        "id": other_uid, "email": "someoneelse@example.com",
        "password_hash": core.hash_password("pw"), "name": "Someone Else",
        "phone": "", "role": "client", "created_at": datetime.now(timezone.utc).isoformat(),
    })
    other_token = core.create_access_token(other_uid, "someoneelse@example.com", "client")
    client.cookies.set("access_token", other_token)
    await settings_store.update_settings(core.db, {
        "paypal_client_id": "pp-id", "paypal_client_secret": "pp-secret",
    })
    r = await client.post("/api/payments/paypal/create-order", json={
        "invoice_id": invoice_id, "tranche_id": tranche_id, "origin_url": "http://localhost:3000",
    })
    assert r.status_code == 403


async def test_paypal_create_order_rejects_already_paid_tranche(client):
    _, invoice_id, tranche_id, token = await _seed_invoice_with_tranche(
        core.db, tranche_status="paid")
    client.cookies.set("access_token", token)
    await settings_store.update_settings(core.db, {
        "paypal_client_id": "pp-id", "paypal_client_secret": "pp-secret",
    })
    r = await client.post("/api/payments/paypal/create-order", json={
        "invoice_id": invoice_id, "tranche_id": tranche_id, "origin_url": "http://localhost:3000",
    })
    assert r.status_code == 400


async def test_paypal_create_order_unconfigured_returns_503(client):
    _, invoice_id, tranche_id, token = await _seed_invoice_with_tranche(core.db)
    client.cookies.set("access_token", token)
    r = await client.post("/api/payments/paypal/create-order", json={
        "invoice_id": invoice_id, "tranche_id": tranche_id, "origin_url": "http://localhost:3000",
    })
    assert r.status_code == 503


async def test_paypal_create_order_upstream_error_returns_502(client):
    _, invoice_id, tranche_id, token = await _seed_invoice_with_tranche(core.db)
    client.cookies.set("access_token", token)
    await settings_store.update_settings(core.db, {
        "paypal_client_id": "pp-id", "paypal_client_secret": "pp-secret",
    })
    with patch.object(payments_routes.paypal, "create_order",
                       side_effect=httpx.HTTPError("boom")):
        r = await client.post("/api/payments/paypal/create-order", json={
            "invoice_id": invoice_id, "tranche_id": tranche_id, "origin_url": "http://localhost:3000",
        })
    assert r.status_code == 502


# ─── PayPal capture ────────────────────────────────────────────────────────

async def test_paypal_capture_marks_tranche_paid(client):
    _, invoice_id, tranche_id, token = await _seed_invoice_with_tranche(core.db)
    client.cookies.set("access_token", token)
    await core.db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()), "invoice_id": invoice_id, "tranche_id": tranche_id,
        "invoice_number": "FAC-2026-999", "tranche_label": "Acompte",
        "client_id": (await core.db.invoices.find_one({"id": invoice_id}))["client_id"],
        "client_name": "Payer", "amount": 100.0, "currency": "eur",
        "session_id": "PAYPAL-ORDER-1", "checkout_url": "https://paypal.example/approve",
        "payment_status": "pending", "payment_method": "paypal",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await settings_store.update_settings(core.db, {
        "paypal_client_id": "pp-id", "paypal_client_secret": "pp-secret",
    })
    with patch.object(payments_routes.paypal, "capture_order",
                       return_value={"status": "COMPLETED"}):
        r = await client.post("/api/payments/paypal/capture/PAYPAL-ORDER-1")
    assert r.status_code == 200
    assert r.json()["payment_status"] == "paid"
    inv = await core.db.invoices.find_one({"id": invoice_id})
    assert inv["payment_tranches"][0]["status"] == "paid"


# ─── Bank transfer ─────────────────────────────────────────────────────────

async def test_bank_transfer_info_requires_auth(client):
    r = await client.get("/api/payments/bank-transfer-info")
    assert r.status_code == 401


async def test_bank_transfer_info_reports_configured_state(client_user_client):
    await settings_store.update_settings(core.db, {
        "bank_iban": "FR7630006000011234567890189", "bank_account_holder": "E3C SARL",
    })
    r = await client_user_client.get("/api/payments/bank-transfer-info")
    assert r.status_code == 200
    data = r.json()
    assert data["configured"] is True
    assert data["iban"] == "FR7630006000011234567890189"


async def test_mark_tranche_paid_requires_admin(client_user_client):
    _, invoice_id, tranche_id, _ = await _seed_invoice_with_tranche(core.db)
    r = await client_user_client.post(
        f"/api/invoices/{invoice_id}/tranches/{tranche_id}/mark-paid",
        json={"payment_method": "virement"})
    assert r.status_code == 403


async def test_mark_tranche_paid_by_admin_succeeds(admin_client):
    _, invoice_id, tranche_id, _ = await _seed_invoice_with_tranche(core.db)
    r = await admin_client.post(
        f"/api/invoices/{invoice_id}/tranches/{tranche_id}/mark-paid",
        json={"payment_method": "virement"})
    assert r.status_code == 200
    inv = await core.db.invoices.find_one({"id": invoice_id})
    assert inv["payment_tranches"][0]["status"] == "paid"
    tx = await core.db.payment_transactions.find_one({"invoice_id": invoice_id})
    assert tx["payment_method"] == "virement"


async def test_mark_tranche_paid_rejects_invalid_method(admin_client):
    _, invoice_id, tranche_id, _ = await _seed_invoice_with_tranche(core.db)
    r = await admin_client.post(
        f"/api/invoices/{invoice_id}/tranches/{tranche_id}/mark-paid",
        json={"payment_method": "bitcoin"})
    assert r.status_code == 400
