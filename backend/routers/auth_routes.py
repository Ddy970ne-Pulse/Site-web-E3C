"""Authentication: email/password register+login, session (/auth/me, logout),
and Google/Facebook/Apple sign-in. Client sign-in only — an existing admin
account can never authenticate through a social provider (see
_oauth_login_or_create below).
"""

import asyncio
import uuid
from datetime import datetime, timezone
from typing import Optional

import httpx
import jwt
from fastapi import APIRouter, HTTPException, Request, Response
from google.auth.transport import requests as google_auth_requests
from google.oauth2 import id_token as google_id_token
from pydantic import BaseModel, EmailStr

import settings_store
from core import (
    AUTH_RATE_LIMIT,
    create_access_token,
    create_refresh_token,
    db,
    get_current_user,
    hash_password,
    limiter,
    set_auth_cookies,
    verify_password,
)

router = APIRouter()


# ─── Models ─────────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = ""


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    credential: str


class FacebookAuthRequest(BaseModel):
    access_token: str


class AppleAuthRequest(BaseModel):
    id_token: str
    # Apple ne renvoie le nom qu'une seule fois, à la toute première autorisation,
    # et uniquement côté frontend (jamais dans le id_token) — donc transmis ici si présent.
    name: Optional[str] = None


# ─── Email/password ─────────────────────────────────────────────────────────
@router.post("/auth/register")
@limiter.limit(AUTH_RATE_LIMIT)
async def register(request: Request, body: RegisterRequest, response: Response):
    email = body.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email déjà utilisé")
    uid = str(uuid.uuid4())
    await db.users.insert_one(
        {
            "id": uid,
            "email": email,
            "password_hash": hash_password(body.password),
            "name": body.name,
            "phone": body.phone,
            "role": "client",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    access = create_access_token(uid, email, "client")
    refresh = create_refresh_token(uid)
    set_auth_cookies(response, access, refresh)
    return {"id": uid, "email": email, "name": body.name, "role": "client"}


@router.post("/auth/login")
@limiter.limit(AUTH_RATE_LIMIT)
async def login(request: Request, body: LoginRequest, response: Response):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not user.get("password_hash"):
        raise HTTPException(401, "Email ou mot de passe incorrect")
    if not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Email ou mot de passe incorrect")
    access = create_access_token(user["id"], email, user["role"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    user.pop("password_hash", None)
    return user


@router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Déconnexion réussie"}


@router.get("/auth/me")
async def me(request: Request):
    return await get_current_user(request)


@router.get("/auth/providers")
async def get_auth_providers():
    """Client IDs des fournisseurs de connexion sociale configurés (publics, pas des
    secrets — c'est leur usage normal d'être embarqués côté client). Permet au
    frontend de savoir quels boutons afficher sans dupliquer la configuration dans
    ses propres variables d'environnement : la source de vérité est settings_store,
    modifiable depuis Admin > Paramètres sans rebuild du frontend."""
    settings = await settings_store.get_settings(db)
    return {
        "google_client_id": settings.get("google_client_id", ""),
        "facebook_app_id": settings.get("facebook_app_id", ""),
        "apple_client_id": settings.get("apple_client_id", ""),
    }


# ─── Google ─────────────────────────────────────────────────────────────────
@router.post("/auth/google")
@limiter.limit(AUTH_RATE_LIMIT)
async def google_auth(request: Request, body: GoogleAuthRequest, response: Response):
    settings = await settings_store.get_settings(db)
    google_client_id = settings.get("google_client_id", "")
    if not google_client_id:
        raise HTTPException(503, "Connexion Google non configurée")
    try:
        idinfo = await asyncio.to_thread(
            google_id_token.verify_oauth2_token,
            body.credential,
            google_auth_requests.Request(),
            google_client_id,
        )
    except ValueError:
        raise HTTPException(401, "Jeton Google invalide")

    email = (idinfo.get("email") or "").lower().strip()
    if not email or not idinfo.get("email_verified"):
        raise HTTPException(401, "Email Google non vérifié")

    name = idinfo.get("name") or email.split("@")[0]
    return await _oauth_login_or_create(
        email, name, "google_id", idinfo["sub"], response, provider_label="Google"
    )


# ─── Facebook ───────────────────────────────────────────────────────────────
@router.post("/auth/facebook")
@limiter.limit(AUTH_RATE_LIMIT)
async def facebook_auth(
    request: Request, body: FacebookAuthRequest, response: Response
):
    settings = await settings_store.get_settings(db)
    facebook_app_id = settings.get("facebook_app_id", "")
    facebook_app_secret = settings.get("facebook_app_secret", "")
    if not facebook_app_id or not facebook_app_secret:
        raise HTTPException(503, "Connexion Facebook non configurée")
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            debug = await c.get(
                "https://graph.facebook.com/debug_token",
                params={
                    "input_token": body.access_token,
                    "access_token": f"{facebook_app_id}|{facebook_app_secret}",
                },
            )
            debug.raise_for_status()
            debug_data = debug.json().get("data", {})
            if (
                not debug_data.get("is_valid")
                or debug_data.get("app_id") != facebook_app_id
            ):
                raise HTTPException(401, "Jeton Facebook invalide")

            profile = await c.get(
                "https://graph.facebook.com/me",
                params={
                    "fields": "id,name,email",
                    "access_token": body.access_token,
                },
            )
            profile.raise_for_status()
            profile_data = profile.json()
    except httpx.HTTPError:
        raise HTTPException(401, "Jeton Facebook invalide")

    # Facebook ne renvoie le champ email que si le compte a un email vérifié
    email = (profile_data.get("email") or "").lower().strip()
    if not email:
        raise HTTPException(
            401, "Votre compte Facebook doit avoir un email vérifié pour continuer"
        )

    name = profile_data.get("name") or email.split("@")[0]
    return await _oauth_login_or_create(
        email,
        name,
        "facebook_id",
        profile_data["id"],
        response,
        provider_label="Facebook",
    )


# ─── Apple ──────────────────────────────────────────────────────────────────
_apple_jwks_client = None


def _get_apple_jwks_client():
    global _apple_jwks_client
    if _apple_jwks_client is None:
        _apple_jwks_client = jwt.PyJWKClient("https://appleid.apple.com/auth/keys")
    return _apple_jwks_client


@router.post("/auth/apple")
@limiter.limit(AUTH_RATE_LIMIT)
async def apple_auth(request: Request, body: AppleAuthRequest, response: Response):
    settings = await settings_store.get_settings(db)
    apple_client_id = settings.get("apple_client_id", "")
    if not apple_client_id:
        raise HTTPException(503, "Connexion Apple non configurée")
    try:
        signing_key = await asyncio.to_thread(
            _get_apple_jwks_client().get_signing_key_from_jwt, body.id_token
        )
        payload = jwt.decode(
            body.id_token,
            signing_key.key,
            algorithms=["RS256"],
            audience=apple_client_id,
            issuer="https://appleid.apple.com",
        )
    except jwt.PyJWTError:
        raise HTTPException(401, "Jeton Apple invalide")

    email = (payload.get("email") or "").lower().strip()
    if not email or str(payload.get("email_verified")).lower() != "true":
        raise HTTPException(401, "Email Apple non vérifié")

    # Apple ne fournit le nom qu'à la 1ère autorisation (via le frontend, pas le jeton)
    name = (body.name or "").strip() or email.split("@")[0]
    return await _oauth_login_or_create(
        email, name, "apple_id", payload["sub"], response, provider_label="Apple"
    )


async def _oauth_login_or_create(
    email: str,
    name: str,
    provider_id_field: str,
    provider_id: str,
    response: Response,
    provider_label: str,
) -> dict:
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing and existing.get("role") == "admin":
        raise HTTPException(
            403,
            f"La connexion {provider_label} n'est pas autorisée pour les administrateurs",
        )

    if existing:
        uid, role, name = existing["id"], existing["role"], existing["name"]
        if not existing.get(provider_id_field):
            await db.users.update_one(
                {"id": uid}, {"$set": {provider_id_field: provider_id}}
            )
    else:
        uid, role = str(uuid.uuid4()), "client"
        await db.users.insert_one(
            {
                "id": uid,
                "email": email,
                "password_hash": None,
                provider_id_field: provider_id,
                "name": name,
                "phone": "",
                "role": role,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )

    access = create_access_token(uid, email, role)
    refresh = create_refresh_token(uid)
    set_auth_cookies(response, access, refresh)
    return {"id": uid, "email": email, "name": name, "role": role}
