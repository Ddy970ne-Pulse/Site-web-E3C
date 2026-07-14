"""Admin-only: client list, self-diagnostics, and the integration Settings
panel (Stripe/Brevo/Google/Facebook/Apple/PayPal/bank-transfer credentials,
stored encrypted in the DB — see settings_store.py).
"""

from typing import Optional

import stripe as stripe_sdk
from fastapi import APIRouter, Request
from pydantic import BaseModel

import diagnostics
import settings_store
from core import UPLOADS_DIR, db, require_admin

router = APIRouter()


class SettingsUpdate(BaseModel):
    stripe_api_key: Optional[str] = None
    stripe_webhook_secret: Optional[str] = None
    brevo_api_key: Optional[str] = None
    google_client_id: Optional[str] = None
    facebook_app_id: Optional[str] = None
    facebook_app_secret: Optional[str] = None
    apple_client_id: Optional[str] = None
    paypal_client_id: Optional[str] = None
    paypal_client_secret: Optional[str] = None
    paypal_mode: Optional[str] = None
    bank_account_holder: Optional[str] = None
    bank_iban: Optional[str] = None
    bank_bic: Optional[str] = None
    bank_name: Optional[str] = None


# ─── Client management ───────────────────────────────────────────────────────
@router.get("/clients")
async def list_clients(request: Request):
    await require_admin(request)
    clients = await db.users.find(
        {"role": "client"}, {"_id": 0, "password_hash": 0}
    ).to_list(1000)
    return clients


# ─── Diagnostics ──────────────────────────────────────────────────────────────
@router.get("/admin/diagnostics")
async def get_diagnostics(request: Request):
    await require_admin(request)
    settings = await settings_store.get_settings(db)
    return await diagnostics.run_all_checks(
        db=db,
        stripe_sdk=stripe_sdk,
        settings=settings,
        uploads_dir=UPLOADS_DIR,
    )


@router.post("/admin/diagnostics/auto-fix")
async def trigger_auto_fix(request: Request):
    await require_admin(request)
    return await diagnostics.run_auto_fixes(db)


# ─── Settings ─────────────────────────────────────────────────────────────────
@router.get("/admin/settings")
async def get_settings_status(request: Request):
    await require_admin(request)
    return await settings_store.get_settings_status(db)


@router.put("/admin/settings")
async def update_settings(body: SettingsUpdate, request: Request):
    await require_admin(request)
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    await settings_store.update_settings(db, updates)
    return await settings_store.get_settings_status(db)
