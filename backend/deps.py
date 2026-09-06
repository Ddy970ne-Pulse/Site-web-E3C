"""Dépendances partagées : auth, rate limiting."""
import os
import jwt
import time
import collections
from typing import Dict
from fastapi import HTTPException, Request

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"

# ─── Rate limiter (en mémoire) ───────────────────────────────────────────────
_rate_buckets: Dict[str, collections.deque] = collections.defaultdict(collections.deque)


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def check_rate_limit(key: str, max_calls: int, window_seconds: int):
    now = time.monotonic()
    dq = _rate_buckets[key]
    while dq and dq[0] < now - window_seconds:
        dq.popleft()
    if len(dq) >= max_calls:
        raise HTTPException(
            status_code=429,
            detail=f"Trop de requêtes. Réessayez dans {window_seconds}s.",
            headers={"Retry-After": str(window_seconds)},
        )
    dq.append(now)


# ─── Auth ────────────────────────────────────────────────────────────────────
async def get_current_user(request: Request, db) -> dict:
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


async def require_admin(request: Request, db) -> dict:
    user = await get_current_user(request, db)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé à l'administrateur")
    return user
