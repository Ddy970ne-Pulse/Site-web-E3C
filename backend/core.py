"""Shared foundation imported by server.py and every router module: DB handle,
config/secrets loading, password/JWT helpers, the `get_current_user` /
`require_admin` / `require_client` auth dependencies, the Brevo email helper,
and the rate limiter. Kept separate from server.py so routers/auth_routes.py,
routers/payments_routes.py and routers/admin_routes.py can depend on it
without importing server.py itself (which would be a circular import, since
server.py is the one that includes those routers).
"""

from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

import logging
import os
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import httpx
import jwt
from fastapi import HTTPException, Request, Response
from motor.motor_asyncio import AsyncIOMotorClient
from slowapi import Limiter
from slowapi.util import get_remote_address

import settings_store

# ─── Config ────────────────────────────────────────────────────────────────
ROOT_DIR = Path(__file__).parent
UPLOADS_DIR = ROOT_DIR / "uploads" / "gallery"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Secrets that were previously committed to source as hardcoded defaults.
# Never allow these values again, even if an operator re-enters them by hand.
_LEAKED_DEFAULTS = {"E3C@Admin2026"}


def require_env(name: str, min_length: int = 1) -> str:
    value = os.environ.get(name, "")
    if len(value) < min_length:
        raise RuntimeError(
            f"{name} environment variable is required and must be at least "
            f"{min_length} characters. Refusing to start with a missing or weak value."
        )
    if value in _LEAKED_DEFAULTS:
        raise RuntimeError(
            f"{name} matches a default value that was previously hardcoded in "
            f"source and committed to the repo's public history. Choose a new, unique value."
        )
    return value


mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]
JWT_SECRET = require_env("JWT_SECRET", min_length=32)
JWT_ALGORITHM = "HS256"
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@e3c-construction.com")
ADMIN_PASSWORD = require_env("ADMIN_PASSWORD", min_length=12)
# Defaults used only when nothing is configured yet in the admin Settings panel
# (settings_store.py falls back to these env vars). Read settings_store.get_settings(db)
# for the current value at each use — never these constants directly, since an admin
# can change them at runtime without a restart.
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "noreply@e3c-construction.com")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "false").lower() == "true"
# Required so integration secrets (Stripe/Brevo/Facebook/PayPal keys) can be stored
# encrypted in the DB when set from the admin Settings panel.
require_env("SETTINGS_ENCRYPTION_KEY", min_length=32)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Per-IP rate limiting on auth endpoints — the login/register/OAuth routes are
# the site's only brute-force/credential-stuffing surface, so they get a tight
# limit while every other route stays unlimited. Registered on the FastAPI app
# (app.state.limiter, exception handler) in server.py, since that's the actual
# app instance; the Limiter object itself lives here so every router can apply
# @limiter.limit(...) without importing server.py.
limiter = Limiter(key_func=get_remote_address)
# 20/min still makes brute-forcing a bcrypt-hashed password impractical
# (≈28,800 guesses/day/IP) while not locking out a shared office IP or an
# automated test suite doing a handful of legitimate logins in a row — a
# tighter 5/min limit was found, while wiring this up, to break exactly that.
AUTH_RATE_LIMIT = "20/minute"


# ─── Password helpers ───────────────────────────────────────────────────────
def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


# ─── JWT helpers ────────────────────────────────────────────────────────────
def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Non authentifié")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Token invalide")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Utilisateur introuvable")
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expirée")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")


async def require_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé à l'administrateur")
    return user


async def require_client(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "client":
        raise HTTPException(status_code=403, detail="Accès réservé aux clients")
    return user


def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie(
        "access_token",
        access,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        max_age=86400,
        path="/",
    )
    response.set_cookie(
        "refresh_token",
        refresh,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        max_age=604800,
        path="/",
    )


# ─── Email helper (Brevo) ───────────────────────────────────────────────────
async def send_email(to_email: str, subject: str, html: str):
    settings = await settings_store.get_settings(db)
    brevo_api_key = settings.get("brevo_api_key", "")
    if not brevo_api_key:
        logger.info(
            f"[EMAIL SKIPPED - No Brevo key] To: {to_email} | Subject: {subject}"
        )
        return
    try:
        async with httpx.AsyncClient() as c:
            await c.post(
                "https://api.brevo.com/v3/smtp/email",
                headers={"api-key": brevo_api_key, "Content-Type": "application/json"},
                json={
                    "sender": {"email": SENDER_EMAIL, "name": "E3C Constructions"},
                    "to": [{"email": to_email}],
                    "subject": subject,
                    "htmlContent": html,
                },
                timeout=10,
            )
    except Exception as e:
        logger.error(f"Email error: {e}")


# ─── Admin seed ─────────────────────────────────────────────────────────────
async def seed_admin():
    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if not existing:
        await db.users.insert_one(
            {
                "id": str(uuid.uuid4()),
                "email": ADMIN_EMAIL,
                "password_hash": hash_password(ADMIN_PASSWORD),
                "name": "Administrateur E3C",
                "phone": "0690 44 97 14",
                "role": "admin",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        logger.info(f"Admin créé: {ADMIN_EMAIL}")
    elif not verify_password(ADMIN_PASSWORD, existing.get("password_hash", "")):
        await db.users.update_one(
            {"email": ADMIN_EMAIL},
            {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}},
        )
