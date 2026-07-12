"""Paramètres d'intégration configurables depuis l'admin (Stripe, Brevo, Google,
Facebook, PayPal), stockés en base plutôt qu'en variables d'environnement.

Les valeurs sensibles sont chiffrées au repos avec SETTINGS_ENCRYPTION_KEY (Fernet,
symétrique). Cette clé elle-même reste obligatoirement une variable d'environnement :
elle ne peut pas être stockée à côté des secrets qu'elle protège.

Une valeur non définie en base retombe sur la variable d'environnement correspondante
(compatibilité avec les déploiements existants). Le cache mémoire est invalidé à
chaque écriture pour que les changements s'appliquent sans redémarrage.
"""
import os
from cryptography.fernet import Fernet, InvalidToken

SETTINGS_DOC_ID = "singleton"

# (nom de champ, variable d'environnement de repli, chiffré ?)
FIELDS = [
    ("stripe_api_key", "STRIPE_API_KEY", True),
    ("stripe_webhook_secret", "STRIPE_WEBHOOK_SECRET", True),
    ("brevo_api_key", "BREVO_API_KEY", True),
    ("google_client_id", "GOOGLE_CLIENT_ID", False),
    ("facebook_app_id", "FACEBOOK_APP_ID", False),
    ("facebook_app_secret", "FACEBOOK_APP_SECRET", True),
    ("paypal_client_id", "PAYPAL_CLIENT_ID", False),
    ("paypal_client_secret", "PAYPAL_CLIENT_SECRET", True),
    ("paypal_mode", "PAYPAL_MODE", False),  # "sandbox" ou "live"
    # Coordonnées bancaires E3C affichées aux clients pour le virement manuel.
    # Pas des secrets (destinées à être communiquées) — non chiffrées, non masquées.
    ("bank_account_holder", "BANK_ACCOUNT_HOLDER", False),
    ("bank_iban", "BANK_IBAN", False),
    ("bank_bic", "BANK_BIC", False),
    ("bank_name", "BANK_NAME", False),
]
FIELD_NAMES = {name for name, _, _ in FIELDS}
ENCRYPTED_FIELDS = {name for name, _, enc in FIELDS if enc}

_cache = None


def _fernet() -> Fernet:
    key = os.environ.get("SETTINGS_ENCRYPTION_KEY", "")
    if not key:
        raise RuntimeError(
            "SETTINGS_ENCRYPTION_KEY environment variable is required to store/read "
            "integration settings. Generate one with: "
            "python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
        )
    return Fernet(key.encode())


def _encrypt(value: str) -> str:
    return _fernet().encrypt(value.encode()).decode()


def _decrypt(value: str) -> str:
    try:
        return _fernet().decrypt(value.encode()).decode()
    except InvalidToken:
        return ""


def invalidate_cache():
    global _cache
    _cache = None


async def get_settings(db) -> dict:
    """Valeurs actuelles (déchiffrées), DB en priorité puis variable d'environnement.
    Mise en cache mémoire ; invalidée à chaque update_settings()."""
    global _cache
    if _cache is not None:
        return _cache

    doc = await db.app_settings.find_one({"_id": SETTINGS_DOC_ID}) or {}
    result = {}
    for name, env_var, encrypted in FIELDS:
        stored = doc.get(name)
        if stored:
            result[name] = _decrypt(stored) if encrypted else stored
        else:
            result[name] = os.environ.get(env_var, "")
    _cache = result
    return result


async def get_settings_status(db) -> dict:
    """Version sûre pour l'API admin : indique si chaque champ est configuré et
    d'où vient la valeur, sans jamais renvoyer le secret en clair."""
    doc = await db.app_settings.find_one({"_id": SETTINGS_DOC_ID}) or {}
    status = {}
    for name, env_var, encrypted in FIELDS:
        stored = doc.get(name)
        if stored:
            decrypted = _decrypt(stored) if encrypted else stored
            source = "database"
        else:
            decrypted = os.environ.get(env_var, "")
            source = "env" if decrypted else "none"
        status[name] = {
            "configured": bool(decrypted),
            "source": source,
            "preview": (f"···{decrypted[-4:]}" if encrypted and decrypted else decrypted) or None,
        }
    return status


async def update_settings(db, updates: dict) -> None:
    """N'écrase que les champs fournis et non vides. Un champ omis ou vide conserve
    sa valeur actuelle (permet de ne changer qu'une seule clé sans re-saisir les autres)."""
    field_map = {name: (encrypted) for name, _, encrypted in FIELDS}
    set_ops = {}
    for name, value in updates.items():
        if name not in FIELD_NAMES or not value:
            continue
        set_ops[name] = _encrypt(value) if field_map[name] else value
    if not set_ops:
        return
    await db.app_settings.update_one(
        {"_id": SETTINGS_DOC_ID}, {"$set": set_ops}, upsert=True
    )
    invalidate_cache()
