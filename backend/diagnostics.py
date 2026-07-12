"""Système d'auto-diagnostic : vérifie l'état des dépendances externes (DB, Stripe,
email) et applique des corrections automatiques limitées à des actions sûres et
réversibles. Aucune action destructive n'est jamais déclenchée automatiquement.
"""
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path

import httpx

logger = logging.getLogger(__name__)

AUTO_FIX_INTERVAL_SECONDS = 3600  # 1h — pas de scheduler externe requis
EXPIRED_SESSION_MAX_AGE_HOURS = 24  # durée de vie d'une session Stripe Checkout


async def check_database(db) -> dict:
    try:
        await db.command("ping")
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}


async def check_stripe(stripe_sdk, api_key: str) -> dict:
    if not api_key:
        return {"status": "disabled", "detail": "STRIPE_API_KEY non configuré"}
    try:
        await stripe_sdk.Balance.retrieve_async()
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}


def check_stripe_webhook(webhook_secret: str) -> dict:
    if not webhook_secret:
        return {"status": "warning", "detail": "STRIPE_WEBHOOK_SECRET non configuré — les webhooks entrants sont ignorés, non vérifiés"}
    return {"status": "ok"}


async def check_email(brevo_api_key: str) -> dict:
    if not brevo_api_key:
        return {"status": "disabled", "detail": "BREVO_API_KEY non configuré — envoi d'emails désactivé (non bloquant)"}
    try:
        async with httpx.AsyncClient() as c:
            r = await c.get("https://api.brevo.com/v3/account",
                             headers={"api-key": brevo_api_key}, timeout=10)
            r.raise_for_status()
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}


def check_uploads_storage(uploads_dir: Path) -> dict:
    try:
        test_file = uploads_dir / ".diagnostic_write_test"
        test_file.write_text("ok")
        test_file.unlink()
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}


def check_optional_config(name: str, value: str, disabled_detail: str) -> dict:
    return {"status": "ok"} if value else {"status": "disabled", "detail": disabled_detail}


async def run_all_checks(*, db, stripe_sdk, stripe_api_key, stripe_webhook_secret,
                          brevo_api_key, uploads_dir, google_client_id) -> dict:
    return {
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "checks": {
            "database": await check_database(db),
            "stripe_api": await check_stripe(stripe_sdk, stripe_api_key),
            "stripe_webhook": check_stripe_webhook(stripe_webhook_secret),
            "email": await check_email(brevo_api_key),
            "uploads_storage": check_uploads_storage(uploads_dir),
            "google_auth": check_optional_config(
                "google_auth", google_client_id, "GOOGLE_CLIENT_ID non configuré — bouton Google masqué"),
        },
    }


async def cleanup_expired_payment_sessions(db, max_age_hours: int = EXPIRED_SESSION_MAX_AGE_HOURS) -> dict:
    """Marque 'expired' les sessions de paiement restées 'pending' au-delà de la durée
    de vie d'une session Stripe Checkout. Ne touche à aucun montant, ne modifie pas
    l'état d'une facture — purement un nettoyage de statut d'affichage."""
    cutoff_iso = (datetime.now(timezone.utc) - timedelta(hours=max_age_hours)).isoformat()
    result = await db.payment_transactions.update_many(
        {"payment_status": "pending", "created_at": {"$lt": cutoff_iso}},
        {"$set": {"payment_status": "expired"}},
    )
    return {"fixed_count": result.modified_count}


async def run_auto_fixes(db) -> dict:
    fixes = {}
    try:
        fixes["expired_payment_sessions"] = await cleanup_expired_payment_sessions(db)
    except Exception as e:
        logger.error(f"Auto-fix error (expired_payment_sessions): {e}")
        fixes["expired_payment_sessions"] = {"error": str(e)}
    return {"fixed_at": datetime.now(timezone.utc).isoformat(), "results": fixes}


async def periodic_auto_fix_loop(db, interval_seconds: int = AUTO_FIX_INTERVAL_SECONDS):
    """Boucle en tâche de fond du process FastAPI — aucune infra externe (cron/Celery)
    requise. S'arrête proprement si la tâche est annulée (arrêt de l'app)."""
    import asyncio
    while True:
        try:
            await asyncio.sleep(interval_seconds)
            result = await run_auto_fixes(db)
            logger.info(f"Auto-fix périodique exécuté: {result}")
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Boucle d'auto-fix périodique en erreur: {e}")
