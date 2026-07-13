"""Payment execution: Stripe Checkout, PayPal orders, manual bank-transfer
mark-paid, payment status polling, and the Stripe webhook. (Setting up an
invoice's payment schedule — /invoices/{id}/tranches — stays in server.py
alongside the rest of invoice CRUD; this module is about actually moving
money, not defining the schedule.)
"""
import uuid
from datetime import datetime, timezone

import httpx
import paypal
import settings_store
import stripe as stripe_sdk
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from core import ADMIN_EMAIL, db, get_current_user, logger, require_admin, send_email

router = APIRouter()


# ─── Models ─────────────────────────────────────────────────────────────────
class CheckoutRequest(BaseModel):
    invoice_id: str
    tranche_id: str
    origin_url: str


class PayPalCheckoutRequest(BaseModel):
    invoice_id: str
    tranche_id: str
    origin_url: str


class MarkTranchePaidRequest(BaseModel):
    payment_method: str = "virement"  # virement | especes | cheque


# ─── Stripe Checkout ─────────────────────────────────────────────────────────
@router.post("/payments/checkout")
async def create_checkout(body: CheckoutRequest, request: Request):
    user = await get_current_user(request)
    inv = await db.invoices.find_one({"id": body.invoice_id}, {"_id": 0})
    if not inv:
        raise HTTPException(404, "Facture introuvable")
    if user["role"] == "client" and inv["client_id"] != user["id"]:
        raise HTTPException(403, "Accès refusé")
    tranche = next((t for t in inv.get("payment_tranches", []) if t["id"] == body.tranche_id), None)
    if not tranche:
        raise HTTPException(404, "Tranche introuvable")
    if tranche["status"] == "paid":
        raise HTTPException(400, "Cette tranche est déjà payée")
    # Existing pending session?
    existing_tx = await db.payment_transactions.find_one({
        "invoice_id": body.invoice_id, "tranche_id": body.tranche_id,
        "payment_status": "pending"}, {"_id": 0})
    if existing_tx:
        return {"checkout_url": existing_tx.get("checkout_url", ""), "session_id": existing_tx["session_id"]}

    settings = await settings_store.get_settings(db)
    stripe_api_key = settings.get("stripe_api_key", "")
    if not stripe_api_key:
        raise HTTPException(503, "Paiement par carte non configuré")

    success_url = f"{body.origin_url}/espace-client?payment=success&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{body.origin_url}/espace-client?payment=cancelled"
    session = await stripe_sdk.checkout.Session.create_async(
        api_key=stripe_api_key,
        mode="payment",
        line_items=[{
            "price_data": {
                "currency": "eur",
                "unit_amount": int(round(float(tranche["amount"]) * 100)),
                "product_data": {"name": f"{inv['invoice_number']} — {tranche['label']}"},
            },
            "quantity": 1,
        }],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"invoice_id": body.invoice_id, "tranche_id": body.tranche_id,
                  "client_id": user["id"], "invoice_number": inv["invoice_number"],
                  "tranche_label": tranche["label"]}
    )
    tx_id = str(uuid.uuid4())
    await db.payment_transactions.insert_one({
        "id": tx_id, "invoice_id": body.invoice_id, "tranche_id": body.tranche_id,
        "invoice_number": inv["invoice_number"], "tranche_label": tranche["label"],
        "client_id": user["id"], "client_name": inv["client_name"],
        "amount": float(tranche["amount"]), "currency": "eur",
        "session_id": session.id, "checkout_url": session.url,
        "payment_status": "pending", "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"checkout_url": session.url, "session_id": session.id}


# ─── PayPal ─────────────────────────────────────────────────────────────────
@router.post("/payments/paypal/create-order")
async def create_paypal_order(body: PayPalCheckoutRequest, request: Request):
    user = await get_current_user(request)
    inv = await db.invoices.find_one({"id": body.invoice_id}, {"_id": 0})
    if not inv:
        raise HTTPException(404, "Facture introuvable")
    if user["role"] == "client" and inv["client_id"] != user["id"]:
        raise HTTPException(403, "Accès refusé")
    tranche = next((t for t in inv.get("payment_tranches", []) if t["id"] == body.tranche_id), None)
    if not tranche:
        raise HTTPException(404, "Tranche introuvable")
    if tranche["status"] == "paid":
        raise HTTPException(400, "Cette tranche est déjà payée")

    settings = await settings_store.get_settings(db)
    client_id = settings.get("paypal_client_id", "")
    client_secret = settings.get("paypal_client_secret", "")
    if not client_id or not client_secret:
        raise HTTPException(503, "Paiement PayPal non configuré")
    mode = settings.get("paypal_mode") or "sandbox"

    return_url = f"{body.origin_url}/espace-client?paypal=success&invoice_id={body.invoice_id}&tranche_id={body.tranche_id}"
    cancel_url = f"{body.origin_url}/espace-client?paypal=cancelled"
    try:
        order = await paypal.create_order(
            client_id, client_secret, mode,
            amount=float(tranche["amount"]), currency="EUR",
            reference_id=f"{inv['invoice_number']}:{tranche['id']}",
            return_url=return_url, cancel_url=cancel_url,
        )
    except httpx.HTTPError as e:
        logger.error(f"Erreur création commande PayPal: {e}")
        raise HTTPException(502, "Erreur lors de la création de la commande PayPal")
    if not order.get("approve_url"):
        raise HTTPException(502, "PayPal n'a pas renvoyé de lien d'approbation")

    tx_id = str(uuid.uuid4())
    await db.payment_transactions.insert_one({
        "id": tx_id, "invoice_id": body.invoice_id, "tranche_id": body.tranche_id,
        "invoice_number": inv["invoice_number"], "tranche_label": tranche["label"],
        "client_id": user["id"], "client_name": inv["client_name"],
        "amount": float(tranche["amount"]), "currency": "eur",
        "session_id": order["order_id"], "checkout_url": order["approve_url"],
        "payment_status": "pending", "payment_method": "paypal",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"approve_url": order["approve_url"], "order_id": order["order_id"]}


@router.post("/payments/paypal/capture/{order_id}")
async def capture_paypal_order(order_id: str, request: Request):
    user = await get_current_user(request)
    tx = await db.payment_transactions.find_one({"session_id": order_id}, {"_id": 0})
    if not tx:
        raise HTTPException(404, "Transaction introuvable")
    if user["role"] == "client" and tx["client_id"] != user["id"]:
        raise HTTPException(403, "Accès refusé")
    if tx["payment_status"] == "paid":
        return {"payment_status": "paid"}

    settings = await settings_store.get_settings(db)
    client_id = settings.get("paypal_client_id", "")
    client_secret = settings.get("paypal_client_secret", "")
    mode = settings.get("paypal_mode") or "sandbox"
    if not client_id or not client_secret:
        raise HTTPException(503, "Paiement PayPal non configuré")

    try:
        result = await paypal.capture_order(client_id, client_secret, mode, order_id)
    except httpx.HTTPError as e:
        logger.error(f"Erreur capture PayPal: {e}")
        raise HTTPException(502, "Erreur lors de la validation du paiement PayPal")

    if result.get("status") == "COMPLETED":
        await db.payment_transactions.update_one({"session_id": order_id},
            {"$set": {"payment_status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}})
        await _mark_tranche_paid(tx["invoice_id"], tx["tranche_id"], payment_method="paypal")
        return {"payment_status": "paid"}
    return {"payment_status": "pending"}


# ─── Status / listing / bank transfer ───────────────────────────────────────
@router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, request: Request):
    user = await get_current_user(request)
    tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not tx:
        raise HTTPException(404, "Transaction introuvable")
    if user["role"] == "client" and tx["client_id"] != user["id"]:
        raise HTTPException(403, "Accès refusé")

    settings = await settings_store.get_settings(db)
    session = await stripe_sdk.checkout.Session.retrieve_async(
        session_id, api_key=settings.get("stripe_api_key", ""))

    if session.payment_status == "paid" and tx["payment_status"] != "paid":
        await db.payment_transactions.update_one({"session_id": session_id},
            {"$set": {"payment_status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}})
        await _mark_tranche_paid(tx["invoice_id"], tx["tranche_id"])

    return {"status": session.status, "payment_status": session.payment_status,
            "amount": (session.amount_total or 0) / 100, "session_id": session_id}


@router.get("/payments")
async def list_payments(request: Request):
    user = await get_current_user(request)
    query = {} if user["role"] == "admin" else {"client_id": user["id"]}
    txs = await db.payment_transactions.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return txs


@router.get("/payments/bank-transfer-info")
async def get_bank_transfer_info(request: Request):
    await get_current_user(request)
    settings = await settings_store.get_settings(db)
    configured = bool(settings.get("bank_iban"))
    return {
        "configured": configured,
        "account_holder": settings.get("bank_account_holder", ""),
        "iban": settings.get("bank_iban", ""),
        "bic": settings.get("bank_bic", ""),
        "bank_name": settings.get("bank_name", ""),
    }


@router.post("/invoices/{invoice_id}/tranches/{tranche_id}/mark-paid")
async def mark_tranche_paid_manually(invoice_id: str, tranche_id: str,
                                       body: MarkTranchePaidRequest, request: Request):
    await require_admin(request)
    if body.payment_method not in ("virement", "especes", "cheque"):
        raise HTTPException(400, "Méthode de paiement invalide")
    inv = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not inv:
        raise HTTPException(404, "Facture introuvable")
    tranche = next((t for t in inv.get("payment_tranches", []) if t["id"] == tranche_id), None)
    if not tranche:
        raise HTTPException(404, "Tranche introuvable")
    if tranche["status"] == "paid":
        raise HTTPException(400, "Cette tranche est déjà payée")

    tx_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    await db.payment_transactions.insert_one({
        "id": tx_id, "invoice_id": invoice_id, "tranche_id": tranche_id,
        "invoice_number": inv["invoice_number"], "tranche_label": tranche["label"],
        "client_id": inv.get("client_id"), "client_name": inv["client_name"],
        "amount": float(tranche["amount"]), "currency": "eur",
        "session_id": f"manual_{tx_id}", "payment_status": "paid",
        "payment_method": body.payment_method,
        "created_at": now_iso, "paid_at": now_iso,
    })
    await _mark_tranche_paid(invoice_id, tranche_id, payment_method=body.payment_method)
    return {"message": "Tranche marquée comme payée"}


# ─── Stripe webhook ───────────────────────────────────────────────────────────
@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    settings = await settings_store.get_settings(db)
    webhook_secret = settings.get("stripe_webhook_secret", "")
    if not webhook_secret:
        logger.error("STRIPE_WEBHOOK_SECRET non configuré — webhook ignoré (payload non vérifié)")
        return {"received": True}
    try:
        event = stripe_sdk.Webhook.construct_event(body, sig, webhook_secret)
        if event.type == "checkout.session.completed":
            session = event.data.object
            if session.get("payment_status") == "paid":
                session_id = session["id"]
                tx = await db.payment_transactions.find_one({"session_id": session_id})
                if tx and tx.get("payment_status") != "paid":
                    await db.payment_transactions.update_one({"session_id": session_id},
                        {"$set": {"payment_status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}})
                    await _mark_tranche_paid(tx["invoice_id"], tx["tranche_id"])
    except Exception as e:
        logger.error(f"Webhook error: {e}")
    return {"received": True}


async def _mark_tranche_paid(invoice_id: str, tranche_id: str, payment_method: str = "carte"):
    inv = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not inv:
        return
    tranches = inv.get("payment_tranches", [])
    for t in tranches:
        if t["id"] == tranche_id:
            t["status"] = "paid"
            t["paid_at"] = datetime.now(timezone.utc).isoformat()
            t["payment_method"] = payment_method
    all_paid = all(t["status"] == "paid" for t in tranches) if tranches else False
    any_paid = any(t["status"] == "paid" for t in tranches)
    new_status = "paid" if all_paid else ("partial" if any_paid else "pending")
    await db.invoices.update_one({"id": invoice_id}, {"$set": {
        "payment_tranches": tranches, "status": new_status,
        "updated_at": datetime.now(timezone.utc).isoformat()}})
    if all_paid:
        html = f"""<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#D4AF37;padding:20px;text-align:center"><h1 style="color:#000;margin:0">E3C Constructions</h1></div>
        <div style="padding:30px;background:#f9f9f9">
          <h2>Paiement complet reçu !</h2>
          <p>La facture <strong>{inv['invoice_number']}</strong> est entièrement réglée.</p>
          <p>Client : {inv['client_name']} · Montant : {inv['total_ttc']:.2f} €</p>
        </div></div>"""
        await send_email(ADMIN_EMAIL, f"Paiement complet - Facture {inv['invoice_number']}", html)
