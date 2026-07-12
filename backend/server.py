from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_auth_requests
import stripe as stripe_sdk
import diagnostics
import httpx
import os, logging, uuid, bcrypt, jwt, asyncio, secrets, io, shutil
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta, date
from bson import ObjectId

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
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
stripe_sdk.api_key = STRIPE_API_KEY
BREVO_API_KEY = os.environ.get("BREVO_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "noreply@e3c-construction.com")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
FACEBOOK_APP_ID = os.environ.get("FACEBOOK_APP_ID", "")
FACEBOOK_APP_SECRET = os.environ.get("FACEBOOK_APP_SECRET", "")
COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "false").lower() == "true"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="E3C API")
api_router = APIRouter(prefix="/api")

# ─── Password helpers ───────────────────────────────────────────────────────
def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())

# ─── JWT helpers ────────────────────────────────────────────────────────────
def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {"sub": user_id, "email": email, "role": role,
               "exp": datetime.now(timezone.utc) + timedelta(hours=24), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
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

# ─── Email helper (Brevo) ───────────────────────────────────────────────────
async def send_email(to_email: str, subject: str, html: str):
    if not BREVO_API_KEY:
        logger.info(f"[EMAIL SKIPPED - No Brevo key] To: {to_email} | Subject: {subject}")
        return
    try:
        async with httpx.AsyncClient() as c:
            await c.post("https://api.brevo.com/v3/smtp/email",
                headers={"api-key": BREVO_API_KEY, "Content-Type": "application/json"},
                json={"sender": {"email": SENDER_EMAIL, "name": "E3C Constructions"},
                      "to": [{"email": to_email}], "subject": subject, "htmlContent": html},
                timeout=10)
    except Exception as e:
        logger.error(f"Email error: {e}")

# ─── Quote number / Invoice number generators ──────────────────────────────
async def next_quote_number() -> str:
    year = datetime.now().year
    count = await db.quotes.count_documents({"quote_number": {"$regex": f"^DEV-{year}-"}})
    return f"DEV-{year}-{str(count + 1).zfill(3)}"

async def next_invoice_number() -> str:
    year = datetime.now().year
    count = await db.invoices.count_documents({"invoice_number": {"$regex": f"^FAC-{year}-"}})
    return f"FAC-{year}-{str(count + 1).zfill(3)}"

# ─── Pydantic Models ────────────────────────────────────────────────────────
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

class LineItem(BaseModel):
    description: str
    quantity: float
    unit_price: float
    tva_rate: float = 8.5

    @property
    def total_ht(self): return round(self.quantity * self.unit_price, 2)
    @property
    def total_tva(self): return round(self.total_ht * self.tva_rate / 100, 2)
    @property
    def total_ttc(self): return round(self.total_ht + self.total_tva, 2)

class QuoteCreate(BaseModel):
    client_id: str
    project_description: str
    line_items: List[LineItem]
    valid_until: str
    notes: Optional[str] = ""
    client_address: Optional[str] = ""

class QuoteUpdate(BaseModel):
    project_description: Optional[str] = None
    line_items: Optional[List[LineItem]] = None
    valid_until: Optional[str] = None
    notes: Optional[str] = None
    client_address: Optional[str] = None
    admin_notes: Optional[str] = None

class QuoteRefuse(BaseModel):
    reason: Optional[str] = ""

class PaymentTranche(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    label: str
    amount: float
    due_date: str
    status: str = "pending"
    paid_at: Optional[str] = None
    stripe_session_id: Optional[str] = None

class InvoiceTranchesUpdate(BaseModel):
    tranches: List[PaymentTranche]

class ContactForm(BaseModel):
    name: str
    phone: str
    commune: str
    service: str
    message: Optional[str] = ""

class QuoteLineItem(BaseModel):
    pricing_item_id: Optional[str] = ""
    description: str
    unit: str
    unit_price_ht: float
    tva_rate: float = 8.5
    quantity: float

class QuoteRequestCreate(BaseModel):
    project_type: str
    services: List[str]
    description: str
    surface: Optional[str] = ""
    commune: str
    address: Optional[str] = ""
    budget_range: Optional[str] = ""
    desired_delay: Optional[str] = ""
    name: str
    email: str
    phone: Optional[str] = ""
    line_items: Optional[List[QuoteLineItem]] = []
    estimated_total_ht: Optional[float] = 0.0
    estimated_total_ttc: Optional[float] = 0.0

class CheckoutRequest(BaseModel):
    invoice_id: str
    tranche_id: str
    origin_url: str

class TestimonialCreate(BaseModel):
    name: str
    commune: Optional[str] = ""
    service: Optional[str] = ""
    stars: int = 5
    text: str
    email: Optional[str] = ""

class GalleryImageMeta(BaseModel):
    label: str
    category: str  # Maçonnerie | Toiture | Rénovation | Peinture | Carrelage

class PricingItemCreate(BaseModel):
    category: str
    description: str
    unit: str           # m², ml, m³, pièce, heure, forfait, jour
    unit_price_ht: float
    tva_rate: float = 8.5
    active: bool = True

class PricingItemUpdate(BaseModel):
    category: Optional[str] = None
    description: Optional[str] = None
    unit: Optional[str] = None
    unit_price_ht: Optional[float] = None
    tva_rate: Optional[float] = None
    active: Optional[bool] = None

# ─── Startup ────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id")
    await db.quotes.create_index("id")
    await db.quotes.create_index("client_id")
    await db.invoices.create_index("id")
    await db.invoices.create_index("client_id")
    await db.payment_transactions.create_index("session_id")
    await seed_admin()
    app.state.auto_fix_task = asyncio.create_task(diagnostics.periodic_auto_fix_loop(db))

@app.on_event("shutdown")
async def shutdown():
    task = getattr(app.state, "auto_fix_task", None)
    if task:
        task.cancel()

async def seed_admin():
    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()), "email": ADMIN_EMAIL,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "name": "Administrateur E3C", "phone": "0690 44 97 14",
            "role": "admin", "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin créé: {ADMIN_EMAIL}")
    elif not verify_password(ADMIN_PASSWORD, existing.get("password_hash", "")):
        await db.users.update_one({"email": ADMIN_EMAIL},
            {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}})

# ─── Auth Routes ────────────────────────────────────────────────────────────
@api_router.post("/auth/register")
async def register(body: RegisterRequest, response: Response):
    email = body.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email déjà utilisé")
    uid = str(uuid.uuid4())
    await db.users.insert_one({
        "id": uid, "email": email, "password_hash": hash_password(body.password),
        "name": body.name, "phone": body.phone, "role": "client",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    access = create_access_token(uid, email, "client")
    refresh = create_refresh_token(uid)
    _set_cookies(response, access, refresh)
    return {"id": uid, "email": email, "name": body.name, "role": "client"}

@api_router.post("/auth/login")
async def login(body: LoginRequest, response: Response):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not user.get("password_hash"):
        raise HTTPException(401, "Email ou mot de passe incorrect")
    if not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Email ou mot de passe incorrect")
    access = create_access_token(user["id"], email, user["role"])
    refresh = create_refresh_token(user["id"])
    _set_cookies(response, access, refresh)
    user.pop("password_hash", None)
    return user

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Déconnexion réussie"}

@api_router.get("/auth/me")
async def me(request: Request):
    return await get_current_user(request)

@api_router.post("/auth/google")
async def google_auth(body: GoogleAuthRequest, response: Response):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(503, "Connexion Google non configurée")
    try:
        idinfo = await asyncio.to_thread(
            google_id_token.verify_oauth2_token,
            body.credential, google_auth_requests.Request(), GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise HTTPException(401, "Jeton Google invalide")

    email = (idinfo.get("email") or "").lower().strip()
    if not email or not idinfo.get("email_verified"):
        raise HTTPException(401, "Email Google non vérifié")

    name = idinfo.get("name") or email.split("@")[0]
    return await _oauth_login_or_create(email, name, "google_id", idinfo["sub"], response,
                                          provider_label="Google")

@api_router.post("/auth/facebook")
async def facebook_auth(body: FacebookAuthRequest, response: Response):
    if not FACEBOOK_APP_ID or not FACEBOOK_APP_SECRET:
        raise HTTPException(503, "Connexion Facebook non configurée")
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            debug = await c.get("https://graph.facebook.com/debug_token", params={
                "input_token": body.access_token,
                "access_token": f"{FACEBOOK_APP_ID}|{FACEBOOK_APP_SECRET}",
            })
            debug.raise_for_status()
            debug_data = debug.json().get("data", {})
            if not debug_data.get("is_valid") or debug_data.get("app_id") != FACEBOOK_APP_ID:
                raise HTTPException(401, "Jeton Facebook invalide")

            profile = await c.get("https://graph.facebook.com/me", params={
                "fields": "id,name,email",
                "access_token": body.access_token,
            })
            profile.raise_for_status()
            profile_data = profile.json()
    except httpx.HTTPError:
        raise HTTPException(401, "Jeton Facebook invalide")

    # Facebook ne renvoie le champ email que si le compte a un email vérifié
    email = (profile_data.get("email") or "").lower().strip()
    if not email:
        raise HTTPException(401, "Votre compte Facebook doit avoir un email vérifié pour continuer")

    name = profile_data.get("name") or email.split("@")[0]
    return await _oauth_login_or_create(email, name, "facebook_id", profile_data["id"], response,
                                          provider_label="Facebook")

async def _oauth_login_or_create(email: str, name: str, provider_id_field: str, provider_id: str,
                                   response: Response, provider_label: str) -> dict:
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing and existing.get("role") == "admin":
        raise HTTPException(403, f"La connexion {provider_label} n'est pas autorisée pour les administrateurs")

    if existing:
        uid, role, name = existing["id"], existing["role"], existing["name"]
        if not existing.get(provider_id_field):
            await db.users.update_one({"id": uid}, {"$set": {provider_id_field: provider_id}})
    else:
        uid, role = str(uuid.uuid4()), "client"
        await db.users.insert_one({
            "id": uid, "email": email, "password_hash": None,
            provider_id_field: provider_id, "name": name, "phone": "",
            "role": role, "created_at": datetime.now(timezone.utc).isoformat()
        })

    access = create_access_token(uid, email, role)
    refresh = create_refresh_token(uid)
    _set_cookies(response, access, refresh)
    return {"id": uid, "email": email, "name": name, "role": role}

def _set_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=COOKIE_SECURE,
                        samesite="lax", max_age=86400, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=COOKIE_SECURE,
                        samesite="lax", max_age=604800, path="/")

# ─── Client management (admin) ──────────────────────────────────────────────
@api_router.get("/clients")
async def list_clients(request: Request):
    await require_admin(request)
    clients = await db.users.find({"role": "client"}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return clients

# ─── Diagnostics (admin) ──────────────────────────────────────────────────────
@api_router.get("/admin/diagnostics")
async def get_diagnostics(request: Request):
    await require_admin(request)
    return await diagnostics.run_all_checks(
        db=db, stripe_sdk=stripe_sdk, stripe_api_key=STRIPE_API_KEY,
        stripe_webhook_secret=STRIPE_WEBHOOK_SECRET, brevo_api_key=BREVO_API_KEY,
        uploads_dir=UPLOADS_DIR, google_client_id=GOOGLE_CLIENT_ID,
    )

@api_router.post("/admin/diagnostics/auto-fix")
async def trigger_auto_fix(request: Request):
    await require_admin(request)
    return await diagnostics.run_auto_fixes(db)

# ─── Quote Routes ────────────────────────────────────────────────────────────
@api_router.get("/quotes")
async def list_quotes(request: Request):
    user = await get_current_user(request)
    query = {} if user["role"] == "admin" else {"client_id": user["id"]}
    quotes = await db.quotes.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return quotes

@api_router.post("/quotes")
async def create_quote(body: QuoteCreate, request: Request):
    await require_admin(request)
    client_user = await db.users.find_one({"id": body.client_id}, {"_id": 0})
    if not client_user:
        raise HTTPException(404, "Client introuvable")
    items = [i.model_dump() for i in body.line_items]
    for item in items:
        item["total_ht"] = round(item["quantity"] * item["unit_price"], 2)
        item["total_tva"] = round(item["total_ht"] * item["tva_rate"] / 100, 2)
        item["total_ttc"] = round(item["total_ht"] + item["total_tva"], 2)
    total_ht = round(sum(i["total_ht"] for i in items), 2)
    total_tva = round(sum(i["total_tva"] for i in items), 2)
    total_ttc = round(total_ht + total_tva, 2)
    qnum = await next_quote_number()
    doc = {
        "id": str(uuid.uuid4()), "quote_number": qnum,
        "client_id": body.client_id, "client_name": client_user["name"],
        "client_email": client_user["email"], "client_phone": client_user.get("phone", ""),
        "client_address": body.client_address,
        "project_description": body.project_description,
        "line_items": items, "total_ht": total_ht, "total_tva": total_tva, "total_ttc": total_ttc,
        "status": "draft", "valid_until": body.valid_until, "notes": body.notes,
        "admin_notes": "", "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.quotes.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/quotes/{quote_id}")
async def get_quote(quote_id: str, request: Request):
    user = await get_current_user(request)
    q = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not q:
        raise HTTPException(404, "Devis introuvable")
    if user["role"] == "client" and q["client_id"] != user["id"]:
        raise HTTPException(403, "Accès refusé")
    return q

@api_router.put("/quotes/{quote_id}")
async def update_quote(quote_id: str, body: QuoteUpdate, request: Request):
    await require_admin(request)
    q = await db.quotes.find_one({"id": quote_id})
    if not q:
        raise HTTPException(404, "Devis introuvable")
    update: Dict[str, Any] = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if body.project_description is not None:
        update["project_description"] = body.project_description
    if body.line_items is not None:
        items = [i.model_dump() for i in body.line_items]
        for item in items:
            item["total_ht"] = round(item["quantity"] * item["unit_price"], 2)
            item["total_tva"] = round(item["total_ht"] * item["tva_rate"] / 100, 2)
            item["total_ttc"] = round(item["total_ht"] + item["total_tva"], 2)
        update["line_items"] = items
        update["total_ht"] = round(sum(i["total_ht"] for i in items), 2)
        update["total_tva"] = round(sum(i["total_tva"] for i in items), 2)
        update["total_ttc"] = round(update["total_ht"] + update["total_tva"], 2)
    if body.valid_until is not None: update["valid_until"] = body.valid_until
    if body.notes is not None: update["notes"] = body.notes
    if body.client_address is not None: update["client_address"] = body.client_address
    if body.admin_notes is not None: update["admin_notes"] = body.admin_notes
    await db.quotes.update_one({"id": quote_id}, {"$set": update})
    return await db.quotes.find_one({"id": quote_id}, {"_id": 0})

@api_router.post("/quotes/{quote_id}/send")
async def send_quote(quote_id: str, request: Request):
    await require_admin(request)
    q = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not q:
        raise HTTPException(404, "Devis introuvable")
    await db.quotes.update_one({"id": quote_id}, {"$set": {"status": "sent",
        "updated_at": datetime.now(timezone.utc).isoformat()}})
    # Send email notification
    html = f"""<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
    <div style="background:#D4AF37;padding:20px;text-align:center">
      <h1 style="color:#000;margin:0;font-size:24px">E3C Constructions</h1>
    </div>
    <div style="padding:30px;background:#f9f9f9">
      <h2>Bonjour {q['client_name']},</h2>
      <p>Votre devis <strong>{q['quote_number']}</strong> est disponible dans votre espace personnel.</p>
      <p><strong>Montant total TTC : {q['total_ttc']:.2f} €</strong></p>
      <p>Valable jusqu'au : {q['valid_until']}</p>
      <div style="text-align:center;margin:30px 0">
        <a href="{FRONTEND_URL}/espace-client" style="background:#D4AF37;color:#000;padding:12px 30px;text-decoration:none;font-weight:bold;border-radius:4px">
          Consulter mon devis
        </a>
      </div>
      <p style="color:#666;font-size:12px">E3C Constructions · Guadeloupe · 0690 44 97 14</p>
    </div></div>"""
    await send_email(q["client_email"], f"Votre devis {q['quote_number']} est prêt - E3C", html)
    return {"message": "Devis envoyé au client"}

@api_router.post("/quotes/{quote_id}/accept")
async def accept_quote(quote_id: str, request: Request):
    user = await get_current_user(request)
    q = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not q:
        raise HTTPException(404, "Devis introuvable")
    if user["role"] == "client" and q["client_id"] != user["id"]:
        raise HTTPException(403, "Accès refusé")
    if q["status"] != "sent":
        raise HTTPException(400, "Ce devis ne peut pas être accepté dans son état actuel")
    await db.quotes.update_one({"id": quote_id}, {"$set": {
        "status": "accepted", "signed_at": datetime.now(timezone.utc).isoformat(),
        "signed_by": user["name"], "updated_at": datetime.now(timezone.utc).isoformat()}})
    html = f"""<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
    <div style="background:#D4AF37;padding:20px;text-align:center">
      <h1 style="color:#000;margin:0">E3C Constructions</h1>
    </div>
    <div style="padding:30px">
      <h2>Devis accepté !</h2>
      <p>Le client <strong>{q['client_name']}</strong> a signé le devis <strong>{q['quote_number']}</strong>.</p>
      <p>Montant : <strong>{q['total_ttc']:.2f} €</strong></p>
      <p>Vous pouvez maintenant convertir ce devis en facture.</p>
    </div></div>"""
    await send_email(ADMIN_EMAIL, f"Devis {q['quote_number']} accepté par {q['client_name']}", html)
    return {"message": "Devis accepté (bon pour accord)"}

@api_router.post("/quotes/{quote_id}/refuse")
async def refuse_quote(quote_id: str, body: QuoteRefuse, request: Request):
    user = await get_current_user(request)
    q = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not q:
        raise HTTPException(404, "Devis introuvable")
    if user["role"] == "client" and q["client_id"] != user["id"]:
        raise HTTPException(403, "Accès refusé")
    await db.quotes.update_one({"id": quote_id}, {"$set": {
        "status": "refused", "refusal_reason": body.reason,
        "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"message": "Devis refusé"}

@api_router.post("/quotes/{quote_id}/convert")
async def convert_to_invoice(quote_id: str, request: Request):
    await require_admin(request)
    q = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not q:
        raise HTTPException(404, "Devis introuvable")
    if q["status"] != "accepted":
        raise HTTPException(400, "Seuls les devis acceptés peuvent être convertis")
    inv_num = await next_invoice_number()
    inv = {
        "id": str(uuid.uuid4()), "invoice_number": inv_num, "quote_id": quote_id,
        "quote_number": q["quote_number"], "client_id": q["client_id"],
        "client_name": q["client_name"], "client_email": q["client_email"],
        "client_phone": q["client_phone"], "client_address": q.get("client_address", ""),
        "project_description": q["project_description"], "line_items": q["line_items"],
        "total_ht": q["total_ht"], "total_tva": q["total_tva"], "total_ttc": q["total_ttc"],
        "status": "pending", "payment_tranches": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.invoices.insert_one(inv)
    await db.quotes.update_one({"id": quote_id}, {"$set": {"status": "converted",
        "invoice_id": inv["id"], "updated_at": datetime.now(timezone.utc).isoformat()}})
    inv.pop("_id", None)
    # Notify client
    html = f"""<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
    <div style="background:#D4AF37;padding:20px;text-align:center">
      <h1 style="color:#000;margin:0">E3C Constructions</h1>
    </div>
    <div style="padding:30px;background:#f9f9f9">
      <h2>Bonjour {q['client_name']},</h2>
      <p>Votre facture <strong>{inv_num}</strong> a été générée.</p>
      <p><strong>Montant total TTC : {q['total_ttc']:.2f} €</strong></p>
      <a href="{FRONTEND_URL}/espace-client" style="background:#D4AF37;color:#000;padding:12px 30px;text-decoration:none;font-weight:bold;display:inline-block;margin:20px 0;border-radius:4px">
        Voir ma facture
      </a>
    </div></div>"""
    await send_email(q["client_email"], f"Votre facture {inv_num} - E3C Constructions", html)
    return inv

@api_router.get("/quotes/{quote_id}/pdf")
async def download_quote_pdf(quote_id: str, request: Request):
    user = await get_current_user(request)
    q = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not q:
        raise HTTPException(404, "Devis introuvable")
    if user["role"] == "client" and q["client_id"] != user["id"]:
        raise HTTPException(403, "Accès refusé")
    pdf_bytes = generate_quote_pdf(q)
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={q['quote_number']}.pdf"})

# ─── Invoice Routes ───────────────────────────────────────────────────────────
@api_router.get("/invoices")
async def list_invoices(request: Request):
    user = await get_current_user(request)
    query = {} if user["role"] == "admin" else {"client_id": user["id"]}
    invs = await db.invoices.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return invs

@api_router.get("/invoices/{invoice_id}")
async def get_invoice(invoice_id: str, request: Request):
    user = await get_current_user(request)
    inv = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not inv:
        raise HTTPException(404, "Facture introuvable")
    if user["role"] == "client" and inv["client_id"] != user["id"]:
        raise HTTPException(403, "Accès refusé")
    return inv

@api_router.put("/invoices/{invoice_id}/tranches")
async def set_invoice_tranches(invoice_id: str, body: InvoiceTranchesUpdate, request: Request):
    await require_admin(request)
    inv = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not inv:
        raise HTTPException(404, "Facture introuvable")
    tranches = [t.model_dump() for t in body.tranches]
    total_tranches = sum(t["amount"] for t in tranches)
    if abs(total_tranches - inv["total_ttc"]) > 0.01:
        raise HTTPException(400, f"Le total des tranches ({total_tranches:.2f}€) doit correspondre au total TTC ({inv['total_ttc']:.2f}€)")
    await db.invoices.update_one({"id": invoice_id}, {"$set": {
        "payment_tranches": tranches, "updated_at": datetime.now(timezone.utc).isoformat()}})
    # Send notification to client
    html = f"""<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
    <div style="background:#D4AF37;padding:20px;text-align:center">
      <h1 style="color:#000;margin:0">E3C Constructions</h1>
    </div>
    <div style="padding:30px;background:#f9f9f9">
      <h2>Bonjour {inv['client_name']},</h2>
      <p>Le calendrier de règlement de votre facture <strong>{inv['invoice_number']}</strong> est disponible.</p>
      <p>Connectez-vous à votre espace personnel pour effectuer vos paiements.</p>
      <a href="{FRONTEND_URL}/espace-client" style="background:#D4AF37;color:#000;padding:12px 30px;text-decoration:none;font-weight:bold;display:inline-block;margin:20px 0;border-radius:4px">
        Accéder à mes paiements
      </a>
    </div></div>"""
    await send_email(inv["client_email"],
        f"Calendrier de règlement - Facture {inv['invoice_number']}", html)
    return await db.invoices.find_one({"id": invoice_id}, {"_id": 0})

@api_router.get("/invoices/{invoice_id}/pdf")
async def download_invoice_pdf(invoice_id: str, request: Request):
    user = await get_current_user(request)
    inv = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not inv:
        raise HTTPException(404, "Facture introuvable")
    if user["role"] == "client" and inv["client_id"] != user["id"]:
        raise HTTPException(403, "Accès refusé")
    pdf_bytes = generate_invoice_pdf(inv)
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={inv['invoice_number']}.pdf"})

# ─── Payment Routes ───────────────────────────────────────────────────────────
@api_router.post("/payments/checkout")
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

    success_url = f"{body.origin_url}/espace-client?payment=success&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{body.origin_url}/espace-client?payment=cancelled"
    session = await stripe_sdk.checkout.Session.create_async(
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

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, request: Request):
    user = await get_current_user(request)
    tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not tx:
        raise HTTPException(404, "Transaction introuvable")
    if user["role"] == "client" and tx["client_id"] != user["id"]:
        raise HTTPException(403, "Accès refusé")

    session = await stripe_sdk.checkout.Session.retrieve_async(session_id)

    if session.payment_status == "paid" and tx["payment_status"] != "paid":
        await db.payment_transactions.update_one({"session_id": session_id},
            {"$set": {"payment_status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}})
        await _mark_tranche_paid(tx["invoice_id"], tx["tranche_id"])

    return {"status": session.status, "payment_status": session.payment_status,
            "amount": (session.amount_total or 0) / 100, "session_id": session_id}

@api_router.get("/payments")
async def list_payments(request: Request):
    user = await get_current_user(request)
    query = {} if user["role"] == "admin" else {"client_id": user["id"]}
    txs = await db.payment_transactions.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return txs

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    if not STRIPE_WEBHOOK_SECRET:
        logger.error("STRIPE_WEBHOOK_SECRET non configuré — webhook ignoré (payload non vérifié)")
        return {"received": True}
    try:
        event = stripe_sdk.Webhook.construct_event(body, sig, STRIPE_WEBHOOK_SECRET)
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

async def _mark_tranche_paid(invoice_id: str, tranche_id: str):
    inv = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not inv:
        return
    tranches = inv.get("payment_tranches", [])
    for t in tranches:
        if t["id"] == tranche_id:
            t["status"] = "paid"
            t["paid_at"] = datetime.now(timezone.utc).isoformat()
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

# ─── Contact (public) ─────────────────────────────────────────────────────────
@api_router.post("/contact")
async def submit_contact(form: ContactForm):
    doc = form.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["submitted_at"] = datetime.now(timezone.utc).isoformat()
    await db.contacts.insert_one({**doc, "_id": doc["id"]})
    return doc

@api_router.post("/quote-requests")
async def create_quote_request(body: QuoteRequestCreate, request: Request):
    uid = str(uuid.uuid4())
    # Try to link to existing client account
    existing_user = await db.users.find_one({"email": body.email.lower()}, {"_id": 0})
    doc = {
        "id": uid,
        "project_type": body.project_type,
        "services": body.services,
        "description": body.description,
        "surface": body.surface,
        "commune": body.commune,
        "address": body.address,
        "budget_range": body.budget_range,
        "desired_delay": body.desired_delay,
        "name": body.name,
        "email": body.email.lower(),
        "phone": body.phone,
        "client_id": existing_user["id"] if existing_user else None,
        "line_items": [li.dict() for li in (body.line_items or [])],
        "estimated_total_ht": round(body.estimated_total_ht or 0, 2),
        "estimated_total_ttc": round(body.estimated_total_ttc or 0, 2),
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.quote_requests.insert_one({**doc, "_id": uid})
    # Notify admin
    html = f"""<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
    <div style="background:#D4AF37;padding:20px;text-align:center"><h1 style="color:#000;margin:0">E3C — Nouvelle demande de devis</h1></div>
    <div style="padding:30px;background:#f9f9f9">
      <p><b>Client :</b> {body.name} ({body.email})</p>
      <p><b>Projet :</b> {body.project_type}</p>
      <p><b>Prestations :</b> {', '.join(body.services)}</p>
      <p><b>Description :</b> {body.description}</p>
      <p><b>Commune :</b> {body.commune}</p>
      <p><b>Budget :</b> {body.budget_range or 'Non précisé'}</p>
      <p><b>Délai :</b> {body.desired_delay or 'Non précisé'}</p>
      {'<p><b>Estimation client :</b> ' + f"{body.estimated_total_ttc:.2f} € TTC</p>" if body.estimated_total_ttc else ''}
    </div></div>"""
    await send_email(ADMIN_EMAIL, f"Nouvelle demande de devis — {body.name}", html)
    return doc

@api_router.get("/quote-requests")
async def list_quote_requests(request: Request):
    await require_admin(request)
    requests_list = await db.quote_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return requests_list

@api_router.put("/quote-requests/{req_id}/status")
async def update_quote_request_status(req_id: str, request: Request):
    await require_admin(request)
    body = await request.json()
    await db.quote_requests.update_one({"id": req_id}, {"$set": {"status": body.get("status", "viewed")}})
    return {"message": "Statut mis à jour"}

@api_router.post("/quote-requests/{req_id}/to-invoice")
async def convert_quote_request_to_invoice(req_id: str, request: Request):
    await require_admin(request)
    qr = await db.quote_requests.find_one({"id": req_id}, {"_id": 0})
    if not qr:
        raise HTTPException(404, "Demande de devis introuvable")
    if qr.get("status") == "converted":
        raise HTTPException(400, "Cette demande a déjà été convertie en facture")

    raw_items = qr.get("line_items") or []
    items = []
    total_ht = 0.0
    total_tva = 0.0

    if raw_items:
        for li in raw_items:
            qty   = float(li.get("quantity", 1))
            price = float(li.get("unit_price_ht", 0))
            tva   = float(li.get("tva_rate", 8.5))
            ht    = round(qty * price, 2)
            t_    = round(ht * tva / 100, 2)
            ttc   = round(ht + t_, 2)
            items.append({
                "description": li.get("description", ""),
                "quantity": qty,
                "unit_price": price,
                "unit": li.get("unit", "forfait"),
                "tva_rate": tva,
                "total_ht": ht,
                "total_tva": t_,
                "total_ttc": ttc,
            })
            total_ht  += ht
            total_tva += t_
    else:
        est_ht  = float(qr.get("estimated_total_ht", 0) or 0)
        est_ttc = float(qr.get("estimated_total_ttc", 0) or 0)
        if est_ht > 0:
            total_ht  = est_ht
            total_tva = round(est_ttc - est_ht, 2)
            items = [{
                "description": f'{qr.get("project_type","Travaux")} — {qr.get("description","")}',
                "quantity": 1.0,
                "unit_price": est_ht,
                "unit": "forfait",
                "tva_rate": 8.5,
                "total_ht": est_ht,
                "total_tva": round(est_ttc - est_ht, 2),
                "total_ttc": est_ttc,
            }]
        else:
            items = [{
                "description": f'{qr.get("project_type","Travaux")} — {qr.get("description","")}',
                "quantity": 1.0,
                "unit_price": 0.0,
                "unit": "forfait",
                "tva_rate": 8.5,
                "total_ht": 0.0,
                "total_tva": 0.0,
                "total_ttc": 0.0,
            }]

    total_ht  = round(total_ht, 2)
    total_tva = round(total_tva, 2)
    total_ttc = round(total_ht + total_tva, 2)

    inv_num   = await next_invoice_number()
    raw_desc  = f'{qr.get("project_type","").strip()} — {qr.get("description","").strip()}'
    proj_desc = raw_desc.strip(" —").strip()

    inv_doc = {
        "id": str(uuid.uuid4()),
        "invoice_number": inv_num,
        "quote_id": None,
        "quote_number": None,
        "quote_request_id": req_id,
        "client_id": qr.get("client_id"),
        "client_name": qr.get("name", ""),
        "client_email": qr.get("email", ""),
        "client_phone": qr.get("phone", ""),
        "client_address": qr.get("address", ""),
        "project_description": proj_desc,
        "line_items": items,
        "total_ht": total_ht,
        "total_tva": total_tva,
        "total_ttc": total_ttc,
        "status": "pending",
        "payment_tranches": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.invoices.insert_one(inv_doc)
    await db.quote_requests.update_one({"id": req_id}, {"$set": {
        "status": "converted",
        "invoice_id": inv_doc["id"],
    }})
    inv_doc.pop("_id", None)

    if inv_doc.get("client_email"):
        html = f"""<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#D4AF37;padding:20px;text-align:center">
          <h1 style="color:#000;margin:0">E3C Constructions</h1>
        </div>
        <div style="padding:30px;background:#f9f9f9">
          <h2>Bonjour {inv_doc['client_name']},</h2>
          <p>Votre facture <strong>{inv_num}</strong> a été générée suite à votre demande de devis.</p>
          <p><strong>Montant total TTC : {total_ttc:.2f} €</strong></p>
          <a href="{FRONTEND_URL}/espace-client" style="background:#D4AF37;color:#000;padding:12px 30px;text-decoration:none;font-weight:bold;display:inline-block;margin:20px 0;border-radius:4px">
            Voir ma facture
          </a>
        </div></div>"""
        await send_email(inv_doc["client_email"], f"Votre facture {inv_num} - E3C Constructions", html)

    return inv_doc

@api_router.get("/")
async def root():
    return {"message": "E3C API v2.0 - Devis & Factures"}

# ─── Gallery ─────────────────────────────────────────────────────────────────
ALLOWED_IMG = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_MB = 10

@api_router.post("/gallery")
async def upload_gallery_image(
    request: Request,
    file: UploadFile = File(...),
    label: str = Form(...),
    category: str = Form(...),
):
    await require_admin(request)
    if file.content_type not in ALLOWED_IMG:
        raise HTTPException(400, "Format non supporté. JPEG, PNG ou WEBP uniquement.")
    data = await file.read()
    if len(data) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(400, f"Fichier trop volumineux (max {MAX_SIZE_MB} Mo).")
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = UPLOADS_DIR / filename
    with open(filepath, "wb") as f:
        f.write(data)
    doc = {
        "id": str(uuid.uuid4()),
        "filename": filename,
        "url": f"/api/uploads/gallery/{filename}",
        "label": label,
        "category": category,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.gallery.insert_one({**doc, "_id": doc["id"]})
    return doc

@api_router.get("/gallery")
async def list_gallery():
    imgs = await db.gallery.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return imgs

@api_router.delete("/gallery/{img_id}")
async def delete_gallery_image(img_id: str, request: Request):
    await require_admin(request)
    img = await db.gallery.find_one({"id": img_id}, {"_id": 0})
    if not img:
        raise HTTPException(404, "Image introuvable")
    try:
        (UPLOADS_DIR / img["filename"]).unlink(missing_ok=True)
    except Exception:
        pass
    await db.gallery.delete_one({"id": img_id})
    return {"message": "Image supprimée"}

# ─── Testimonials ─────────────────────────────────────────────────────────────
@api_router.post("/testimonials")
async def submit_testimonial(body: TestimonialCreate):
    if not body.name.strip() or not body.text.strip():
        raise HTTPException(400, "Nom et témoignage requis.")
    if body.stars < 1 or body.stars > 5:
        raise HTTPException(400, "Note entre 1 et 5.")
    doc = {
        "id": str(uuid.uuid4()),
        "name": body.name.strip(),
        "commune": body.commune.strip(),
        "service": body.service.strip(),
        "stars": body.stars,
        "text": body.text.strip(),
        "email": body.email.lower().strip() if body.email else "",
        "status": "pending",
        "initials": "".join(w[0].upper() for w in body.name.strip().split()[:2]),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.testimonials.insert_one({**doc, "_id": doc["id"]})
    return {"message": "Témoignage soumis. Il sera publié après validation.", "id": doc["id"]}

@api_router.get("/testimonials")
async def list_testimonials():
    docs = await db.testimonials.find({"status": "approved"}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return docs

@api_router.get("/testimonials/admin")
async def list_testimonials_admin(request: Request):
    await require_admin(request)
    docs = await db.testimonials.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return docs

@api_router.patch("/testimonials/{t_id}")
async def update_testimonial_status(t_id: str, request: Request):
    await require_admin(request)
    body = await request.json()
    status = body.get("status")
    if status not in ("approved", "rejected", "pending"):
        raise HTTPException(400, "Statut invalide")
    await db.testimonials.update_one({"id": t_id}, {"$set": {"status": status}})
    return {"message": "Statut mis à jour"}

# ─── Pricing Grid ──────────────────────────────────────────────────────────────
@api_router.get("/pricing-grid")
async def list_pricing():
    items = await db.pricing_grid.find({}, {"_id": 0}).sort([("category", 1), ("description", 1)]).to_list(500)
    return items

@api_router.post("/pricing-grid")
async def create_pricing_item(body: PricingItemCreate, request: Request):
    await require_admin(request)
    if body.unit_price_ht < 0:
        raise HTTPException(400, "Le prix doit être positif.")
    doc = {
        "id": str(uuid.uuid4()),
        "category": body.category.strip(),
        "description": body.description.strip(),
        "unit": body.unit.strip(),
        "unit_price_ht": round(body.unit_price_ht, 2),
        "tva_rate": body.tva_rate,
        "active": body.active,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.pricing_grid.insert_one({**doc, "_id": doc["id"]})
    return doc

@api_router.put("/pricing-grid/{item_id}")
async def update_pricing_item(item_id: str, body: PricingItemUpdate, request: Request):
    await require_admin(request)
    update = {k: v for k, v in body.dict().items() if v is not None}
    if "unit_price_ht" in update:
        update["unit_price_ht"] = round(update["unit_price_ht"], 2)
    if not update:
        raise HTTPException(400, "Aucun champ à mettre à jour")
    await db.pricing_grid.update_one({"id": item_id}, {"$set": update})
    item = await db.pricing_grid.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(404, "Article introuvable")
    return item

@api_router.delete("/pricing-grid/{item_id}")
async def delete_pricing_item(item_id: str, request: Request):
    await require_admin(request)
    result = await db.pricing_grid.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Article introuvable")
    return {"message": "Article supprimé"}

# ─── PDF Generation ───────────────────────────────────────────────────────────
def generate_quote_pdf(q: dict) -> bytes:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable

    buf = io.BytesIO()
    CW = 17.4 * cm
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            leftMargin=1.8*cm, rightMargin=1.8*cm,
                            topMargin=1.5*cm, bottomMargin=2*cm)

    GOLD  = colors.HexColor("#D4AF37")
    DARK  = colors.HexColor("#111111")
    LIGHT = colors.HexColor("#F8F8F8")
    BORDER = colors.HexColor("#DDDDDD")
    ss    = getSampleStyleSheet()
    base  = ss["Normal"]

    def esc(s):
        return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    def P(txt, size=9, color="#333333", bold=False):
        b, eb = ("<b>", "</b>") if bold else ("", "")
        return Paragraph(f'{b}<font size="{size}" color="{color}">{esc(txt)}</font>{eb}', base)

    elems   = []
    now_str = datetime.now().strftime("%d/%m/%Y")
    LW = 8.5 * cm
    RW = CW - LW

    # ── HEADER ──────────────────────────────────────────────
    left_data = [
        [P("E3C", 26, "#D4AF37", True)],
        [P("Entreprise de Constructions", 9, "#333333", True)],
        [P("Guadeloupe  971", 8.5, "#666666")],
        [P("contact@e3c-construction.com", 8.5, "#666666")],
    ]
    left_t = Table(left_data, colWidths=[LW])
    left_t.setStyle(TableStyle([
        ("TOPPADDING",    (0,0),(-1,-1), 3),
        ("BOTTOMPADDING", (0,0),(-1,-1), 3),
        ("LEFTPADDING",   (0,0),(-1,-1), 0),
        ("RIGHTPADDING",  (0,0),(-1,-1), 8),
    ]))

    valid = esc(q.get("valid_until") or "—")
    right_data = [
        [P("DEVIS", 15, "#FFFFFF", True)],
        [P(esc(q["quote_number"]), 12, "#D4AF37", True)],
        [Spacer(1, 0.15*cm)],
        [Paragraph(f'<font size="8" color="#AAAAAA">Date :             </font><font size="8.5" color="#FFFFFF">{now_str}</font>', base)],
        [Paragraph(f'<font size="8" color="#AAAAAA">Valable jusqu\'au : </font><font size="8.5" color="#D4AF37">{valid}</font>', base)],
    ]
    right_t = Table(right_data, colWidths=[RW])
    right_t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1), DARK),
        ("TOPPADDING",    (0,0),(-1,-1), 4),
        ("BOTTOMPADDING", (0,0),(-1,-1), 4),
        ("LEFTPADDING",   (0,0),(-1,-1), 14),
        ("RIGHTPADDING",  (0,0),(-1,-1), 10),
        ("TOPPADDING",    (0,0),(0,0), 14),
        ("BOTTOMPADDING", (0,-1),(-1,-1), 14),
    ]))
    header_t = Table([[left_t, right_t]], colWidths=[LW, RW])
    header_t.setStyle(TableStyle([
        ("VALIGN",        (0,0),(-1,-1), "TOP"),
        ("LEFTPADDING",   (0,0),(-1,-1), 0),
        ("RIGHTPADDING",  (0,0),(-1,-1), 0),
        ("TOPPADDING",    (0,0),(-1,-1), 0),
        ("BOTTOMPADDING", (0,0),(-1,-1), 0),
    ]))
    elems.append(header_t)
    elems.append(Spacer(1, 0.5*cm))
    elems.append(HRFlowable(width="100%", thickness=1.5, color=GOLD, spaceAfter=0.4*cm))

    # ── ÉTABLI POUR ─────────────────────────────────────────
    cli_rows = [
        [P("ETABLI POUR :", 7.5, "#999999")],
        [P(q["client_name"], 10, "#222222", True)],
        [P(q["client_email"], 8.5, "#555555")],
    ]
    if q.get("client_phone"):
        cli_rows.append([P(f'Tel : {q["client_phone"]}', 8.5, "#555555")])
    if q.get("client_address"):
        cli_rows.append([P(q["client_address"], 8.5, "#555555")])
    cli_t = Table(cli_rows, colWidths=[CW])
    cli_t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1), LIGHT),
        ("LEFTPADDING",   (0,0),(-1,-1), 10),
        ("TOPPADDING",    (0,0),(-1,-1), 4),
        ("BOTTOMPADDING", (0,0),(-1,-1), 4),
        ("TOPPADDING",    (0,0),(0,0), 8),
        ("BOTTOMPADDING", (0,-1),(-1,-1), 8),
        ("BOX",           (0,0),(-1,-1), 0.5, BORDER),
    ]))
    elems.append(cli_t)
    elems.append(Spacer(1, 0.4*cm))

    if q.get("project_description"):
        elems.append(P(f'Objet : {q["project_description"]}', 9))
        elems.append(Spacer(1, 0.4*cm))

    # ── LINE ITEMS ──────────────────────────────────────────
    cw_items = [6.9*cm, 1.5*cm, 2.5*cm, 1.5*cm, 2.5*cm, 2.5*cm]
    hdr = [P(h, 8.5, "#FFFFFF", True) for h in ["Description","Qte","P.U. HT","TVA","Total HT","Total TTC"]]
    rows = [hdr]
    for item in q.get("line_items", []):
        rows.append([
            P(item.get("description",""), 8.5),
            P(str(item.get("quantity","")), 8.5),
            P(f'{item.get("unit_price",0):.2f} EUR', 8.5),
            P(f'{item.get("tva_rate",8.5):.1f}%', 8.5),
            P(f'{item.get("total_ht",0):.2f} EUR', 8.5),
            P(f'{item.get("total_ttc",0):.2f} EUR', 8.5, "#333333", True),
        ])
    items_t = Table(rows, colWidths=cw_items, repeatRows=1)
    items_t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,0), DARK),
        ("ROWBACKGROUNDS",(0,1),(-1,-1), [colors.white, LIGHT]),
        ("GRID",          (0,0),(-1,-1), 0.4, BORDER),
        ("ALIGN",         (1,0),(-1,-1), "CENTER"),
        ("ALIGN",         (4,1),(5,-1), "RIGHT"),
        ("TOPPADDING",    (0,0),(-1,-1), 6),
        ("BOTTOMPADDING", (0,0),(-1,-1), 6),
        ("LEFTPADDING",   (0,0),(0,-1), 8),
        ("RIGHTPADDING",  (5,0),(5,-1), 8),
        ("VALIGN",        (0,0),(-1,-1), "MIDDLE"),
    ]))
    elems.append(items_t)
    elems.append(Spacer(1, 0.3*cm))

    # ── TOTALS ──────────────────────────────────────────────
    TW = 7.5 * cm
    t_rows = [
        [P("Total HT :", 9),  P(f'{q["total_ht"]:.2f} EUR', 9, "#333333", True)],
        [P("TVA :", 9),       P(f'{q.get("total_tva",0):.2f} EUR', 9, "#555555")],
        [P("TOTAL TTC :", 10, "#111111", True), P(f'{q["total_ttc"]:.2f} EUR', 11, "#D4AF37", True)],
    ]
    tot_t = Table(t_rows, colWidths=[4.0*cm, TW - 4.0*cm])
    tot_t.setStyle(TableStyle([
        ("ALIGN",         (1,0),(1,-1), "RIGHT"),
        ("TOPPADDING",    (0,0),(-1,-1), 5),
        ("BOTTOMPADDING", (0,0),(-1,-1), 5),
        ("LEFTPADDING",   (0,0),(-1,-1), 10),
        ("RIGHTPADDING",  (0,0),(-1,-1), 10),
        ("LINEABOVE",     (0,-1),(-1,-1), 0.5, BORDER),
        ("BACKGROUND",    (0,-1),(-1,-1), colors.HexColor("#FBF7E8")),
        ("TOPPADDING",    (0,-1),(-1,-1), 8),
        ("BOTTOMPADDING", (0,-1),(-1,-1), 8),
    ]))
    wrap = Table([[Spacer(1,1), tot_t]], colWidths=[CW - TW, TW])
    wrap.setStyle(TableStyle([
        ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0),
        ("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0),
    ]))
    elems.append(wrap)

    if q.get("notes"):
        elems.append(Spacer(1, 0.5*cm))
        elems.append(HRFlowable(width="100%", thickness=0.5, color=BORDER))
        elems.append(Spacer(1, 0.3*cm))
        elems.append(P(f'Notes : {q["notes"]}', 9, "#555555"))

    elems.append(Spacer(1, 1.2*cm))

    # ── DISCLAIMER ──────────────────────────────────────────
    disc_text = Paragraph(
        '<font size="8" color="#92400E"><b>Estimation prévisionnelle, non contractuelle</b> — '
        'Ce chiffrage est établi sur la base des informations communiquées et reste indicatif. '
        "Une visite technique gratuite de l'un de nos experts permettra de confirmer et finaliser "
        'les tarifs définitifs. Tout ajustement éventuel sera soumis à votre validation avant tout engagement.</font>',
        base
    )
    disc_t = Table([[disc_text]], colWidths=[CW])
    disc_t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1), colors.HexColor("#FFFBEB")),
        ("LEFTPADDING",   (0,0),(-1,-1), 10),
        ("RIGHTPADDING",  (0,0),(-1,-1), 10),
        ("TOPPADDING",    (0,0),(-1,-1), 8),
        ("BOTTOMPADDING", (0,0),(-1,-1), 8),
        ("BOX",           (0,0),(-1,-1), 0.5, colors.HexColor("#F59E0B")),
    ]))
    elems.append(disc_t)
    elems.append(Spacer(1, 0.8*cm))

    sig_t = Table([
        [P("Bon pour accord :", 8.5, "#666666"), P("Signature du client :", 8.5, "#666666")],
        [P(q["client_name"], 9, "#333333", True), Spacer(1, 0.1*cm)],
        [Spacer(1, 1.2*cm), Spacer(1, 1.2*cm)],
    ], colWidths=[CW/2, CW/2])
    sig_t.setStyle(TableStyle([
        ("BOX",          (0,0),(-1,-1), 0.5, BORDER),
        ("LINEAFTER",    (0,0),(0,-1), 0.5, BORDER),
        ("TOPPADDING",   (0,0),(-1,-1), 6),
        ("BOTTOMPADDING",(0,0),(-1,-1), 6),
        ("LEFTPADDING",  (0,0),(-1,-1), 10),
    ]))
    elems.append(sig_t)

    elems.append(Spacer(1, 0.8*cm))
    elems.append(HRFlowable(width="100%", thickness=0.5, color=BORDER))
    elems.append(Spacer(1, 0.3*cm))
    elems.append(P("E3C Entreprise de Constructions  -  Guadeloupe (971)  -  contact@e3c-construction.com", 7.5, "#999999"))
    doc.build(elems)
    return buf.getvalue()

def generate_invoice_pdf(inv: dict) -> bytes:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable

    buf = io.BytesIO()
    CW = 17.4 * cm
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            leftMargin=1.8*cm, rightMargin=1.8*cm,
                            topMargin=1.5*cm, bottomMargin=2*cm)

    GOLD  = colors.HexColor("#D4AF37")
    DARK  = colors.HexColor("#111111")
    LIGHT = colors.HexColor("#F8F8F8")
    BORDER = colors.HexColor("#DDDDDD")
    ss    = getSampleStyleSheet()
    base  = ss["Normal"]

    def esc(s):
        return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    def P(txt, size=9, color="#333333", bold=False):
        b, eb = ("<b>", "</b>") if bold else ("", "")
        return Paragraph(f'{b}<font size="{size}" color="{color}">{esc(txt)}</font>{eb}', base)

    elems   = []
    now_str = datetime.now().strftime("%d/%m/%Y")
    LW = 8.5 * cm
    RW = CW - LW

    # ── HEADER ──────────────────────────────────────────────
    left_data = [
        [P("E3C", 26, "#D4AF37", True)],
        [P("Entreprise de Constructions", 9, "#333333", True)],
        [P("Guadeloupe  971", 8.5, "#666666")],
        [P("contact@e3c-construction.com", 8.5, "#666666")],
    ]
    left_t = Table(left_data, colWidths=[LW])
    left_t.setStyle(TableStyle([
        ("TOPPADDING",    (0,0),(-1,-1), 3),
        ("BOTTOMPADDING", (0,0),(-1,-1), 3),
        ("LEFTPADDING",   (0,0),(-1,-1), 0),
        ("RIGHTPADDING",  (0,0),(-1,-1), 8),
    ]))

    ref_val = esc(inv.get("quote_number") or "—")
    right_data = [
        [P("FACTURE", 15, "#FFFFFF", True)],
        [P(esc(inv["invoice_number"]), 12, "#D4AF37", True)],
        [Spacer(1, 0.15*cm)],
        [Paragraph(f'<font size="8" color="#AAAAAA">Date :         </font><font size="8.5" color="#FFFFFF">{now_str}</font>', base)],
        [Paragraph(f'<font size="8" color="#AAAAAA">Ref. devis :   </font><font size="8.5" color="#D4AF37">{ref_val}</font>', base)],
    ]
    right_t = Table(right_data, colWidths=[RW])
    right_t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1), DARK),
        ("TOPPADDING",    (0,0),(-1,-1), 4),
        ("BOTTOMPADDING", (0,0),(-1,-1), 4),
        ("LEFTPADDING",   (0,0),(-1,-1), 14),
        ("RIGHTPADDING",  (0,0),(-1,-1), 10),
        ("TOPPADDING",    (0,0),(0,0), 14),
        ("BOTTOMPADDING", (0,-1),(-1,-1), 14),
    ]))
    header_t = Table([[left_t, right_t]], colWidths=[LW, RW])
    header_t.setStyle(TableStyle([
        ("VALIGN",        (0,0),(-1,-1), "TOP"),
        ("LEFTPADDING",   (0,0),(-1,-1), 0),
        ("RIGHTPADDING",  (0,0),(-1,-1), 0),
        ("TOPPADDING",    (0,0),(-1,-1), 0),
        ("BOTTOMPADDING", (0,0),(-1,-1), 0),
    ]))
    elems.append(header_t)
    elems.append(Spacer(1, 0.5*cm))
    elems.append(HRFlowable(width="100%", thickness=1.5, color=GOLD, spaceAfter=0.4*cm))

    # ── FACTURER À ──────────────────────────────────────────
    bill_rows = [
        [P("FACTURER A :", 7.5, "#999999")],
        [P(inv["client_name"], 10, "#222222", True)],
        [P(inv["client_email"], 8.5, "#555555")],
    ]
    if inv.get("client_phone"):
        bill_rows.append([P(f'Tel : {inv["client_phone"]}', 8.5, "#555555")])
    if inv.get("client_address"):
        bill_rows.append([P(inv["client_address"], 8.5, "#555555")])
    bill_t = Table(bill_rows, colWidths=[CW])
    bill_t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1), LIGHT),
        ("LEFTPADDING",   (0,0),(-1,-1), 10),
        ("TOPPADDING",    (0,0),(-1,-1), 4),
        ("BOTTOMPADDING", (0,0),(-1,-1), 4),
        ("TOPPADDING",    (0,0),(0,0), 8),
        ("BOTTOMPADDING", (0,-1),(-1,-1), 8),
        ("BOX",           (0,0),(-1,-1), 0.5, BORDER),
    ]))
    elems.append(bill_t)
    elems.append(Spacer(1, 0.4*cm))

    if inv.get("project_description"):
        elems.append(P(f'Objet : {inv["project_description"]}', 9))
        elems.append(Spacer(1, 0.4*cm))

    # ── LINE ITEMS ──────────────────────────────────────────
    cw_items = [6.9*cm, 1.5*cm, 2.5*cm, 1.5*cm, 2.5*cm, 2.5*cm]
    hdr = [P(h, 8.5, "#FFFFFF", True) for h in ["Description","Qte","P.U. HT","TVA","Total HT","Total TTC"]]
    rows = [hdr]
    for item in inv.get("line_items", []):
        rows.append([
            P(item.get("description",""), 8.5),
            P(str(item.get("quantity","")), 8.5),
            P(f'{item.get("unit_price",0):.2f} EUR', 8.5),
            P(f'{item.get("tva_rate",8.5):.1f}%', 8.5),
            P(f'{item.get("total_ht",0):.2f} EUR', 8.5),
            P(f'{item.get("total_ttc",0):.2f} EUR', 8.5, "#333333", True),
        ])
    items_t = Table(rows, colWidths=cw_items, repeatRows=1)
    items_t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,0), DARK),
        ("ROWBACKGROUNDS",(0,1),(-1,-1), [colors.white, LIGHT]),
        ("GRID",          (0,0),(-1,-1), 0.4, BORDER),
        ("ALIGN",         (1,0),(-1,-1), "CENTER"),
        ("ALIGN",         (4,1),(5,-1), "RIGHT"),
        ("TOPPADDING",    (0,0),(-1,-1), 6),
        ("BOTTOMPADDING", (0,0),(-1,-1), 6),
        ("LEFTPADDING",   (0,0),(0,-1), 8),
        ("RIGHTPADDING",  (5,0),(5,-1), 8),
        ("VALIGN",        (0,0),(-1,-1), "MIDDLE"),
    ]))
    elems.append(items_t)
    elems.append(Spacer(1, 0.3*cm))

    # ── TOTALS ──────────────────────────────────────────────
    TW = 7.5 * cm
    t_rows = [
        [P("Total HT :", 9),  P(f'{inv["total_ht"]:.2f} EUR', 9, "#333333", True)],
        [P("TVA :", 9),       P(f'{inv.get("total_tva",0):.2f} EUR', 9, "#555555")],
        [P("TOTAL TTC :", 10, "#111111", True), P(f'{inv["total_ttc"]:.2f} EUR', 11, "#D4AF37", True)],
    ]
    tot_t = Table(t_rows, colWidths=[4.0*cm, TW - 4.0*cm])
    tot_t.setStyle(TableStyle([
        ("ALIGN",         (1,0),(1,-1), "RIGHT"),
        ("TOPPADDING",    (0,0),(-1,-1), 5),
        ("BOTTOMPADDING", (0,0),(-1,-1), 5),
        ("LEFTPADDING",   (0,0),(-1,-1), 10),
        ("RIGHTPADDING",  (0,0),(-1,-1), 10),
        ("LINEABOVE",     (0,-1),(-1,-1), 0.5, BORDER),
        ("BACKGROUND",    (0,-1),(-1,-1), colors.HexColor("#FBF7E8")),
        ("TOPPADDING",    (0,-1),(-1,-1), 8),
        ("BOTTOMPADDING", (0,-1),(-1,-1), 8),
    ]))
    wrap = Table([[Spacer(1,1), tot_t]], colWidths=[CW - TW, TW])
    wrap.setStyle(TableStyle([
        ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0),
        ("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0),
    ]))
    elems.append(wrap)

    # ── PAYMENT SCHEDULE ────────────────────────────────────
    if inv.get("payment_tranches"):
        elems.append(Spacer(1, 0.6*cm))
        elems.append(HRFlowable(width="100%", thickness=0.5, color=BORDER))
        elems.append(Spacer(1, 0.3*cm))
        elems.append(P("Calendrier de reglement", 9, "#111111", True))
        elems.append(Spacer(1, 0.3*cm))
        tr_cw = [7.0*cm, 3.0*cm, 4.0*cm, 3.4*cm]
        tr_hdr = [P(h, 8.5, "#333333", True) for h in ["Tranche","Montant","Echeance","Statut"]]
        tr_rows = [tr_hdr]
        for t in inv["payment_tranches"]:
            sc = "#16a34a" if t["status"] == "paid" else "#B45309"
            sl = "Paye" if t["status"] == "paid" else "En attente"
            tr_rows.append([
                P(t["label"], 8.5),
                P(f'{t["amount"]:.2f} EUR', 8.5, "#333333", True),
                P(t.get("due_date","—"), 8.5),
                P(sl, 8.5, sc, True),
            ])
        trt = Table(tr_rows, colWidths=tr_cw)
        trt.setStyle(TableStyle([
            ("BACKGROUND",    (0,0),(-1,0), LIGHT),
            ("GRID",          (0,0),(-1,-1), 0.4, BORDER),
            ("TOPPADDING",    (0,0),(-1,-1), 6),
            ("BOTTOMPADDING", (0,0),(-1,-1), 6),
            ("LEFTPADDING",   (0,0),(0,-1), 8),
            ("ALIGN",         (1,0),(1,-1), "RIGHT"),
        ]))
        elems.append(trt)

    elems.append(Spacer(1, 0.8*cm))
    elems.append(HRFlowable(width="100%", thickness=0.5, color=BORDER))
    elems.append(Spacer(1, 0.3*cm))
    elems.append(P("E3C Entreprise de Constructions  -  Guadeloupe (971)  -  contact@e3c-construction.com", 7.5, "#999999"))
    doc.build(elems)
    return buf.getvalue()

# ─── App config ───────────────────────────────────────────────────────────────
app.mount("/api/uploads", StaticFiles(directory=str(ROOT_DIR / "uploads")), name="uploads")
app.include_router(api_router)
app.add_middleware(CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.on_event("shutdown")
async def shutdown():
    client.close()
