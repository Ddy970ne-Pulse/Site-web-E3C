"""Système d'auto-diagnostic : vérifie l'état des dépendances externes (DB, Stripe,
email) et applique des corrections automatiques limitées à des actions sûres et
réversibles. Aucune action destructive n'est jamais déclenchée automatiquement.
"""

import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path

import httpx

logger = logging.getLogger(__name__)

AUTO_FIX_INTERVAL_SECONDS = 3600  # 1h — pas de scheduler externe requis
EXPIRED_SESSION_MAX_AGE_HOURS = 24  # durée de vie d'une session Stripe Checkout
ALERT_COOLDOWN_HOURS = 12  # ne pas ré-alerter sur le même problème avant ce délai

CHECK_LABELS_FR = {
    "database": "Base de données",
    "stripe_api": "API Stripe",
    "email": "Envoi d'emails (Brevo)",
    "uploads_storage": "Stockage des images",
}


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
        return {
            "status": "warning",
            "detail": "STRIPE_WEBHOOK_SECRET non configuré — les webhooks entrants sont ignorés, non vérifiés",
        }
    return {"status": "ok"}


async def check_email(brevo_api_key: str) -> dict:
    if not brevo_api_key:
        return {
            "status": "disabled",
            "detail": "BREVO_API_KEY non configuré — envoi d'emails désactivé (non bloquant)",
        }
    try:
        async with httpx.AsyncClient() as c:
            r = await c.get(
                "https://api.brevo.com/v3/account",
                headers={"api-key": brevo_api_key},
                timeout=10,
            )
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
    return (
        {"status": "ok"} if value else {"status": "disabled", "detail": disabled_detail}
    )


async def run_all_checks(*, db, stripe_sdk, settings: dict, uploads_dir) -> dict:
    """`settings` vient de settings_store.get_settings(db) — lu à chaque appel,
    donc reflète toujours la configuration actuelle (DB ou variable d'environnement)."""
    return {
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "checks": {
            "database": await check_database(db),
            "stripe_api": await check_stripe(
                stripe_sdk, settings.get("stripe_api_key", "")
            ),
            "stripe_webhook": check_stripe_webhook(
                settings.get("stripe_webhook_secret", "")
            ),
            "email": await check_email(settings.get("brevo_api_key", "")),
            "uploads_storage": check_uploads_storage(uploads_dir),
            "google_auth": check_optional_config(
                "google_auth",
                settings.get("google_client_id", ""),
                "GOOGLE_CLIENT_ID non configuré — bouton Google masqué",
            ),
        },
    }


async def cleanup_expired_payment_sessions(
    db, max_age_hours: int = EXPIRED_SESSION_MAX_AGE_HOURS
) -> dict:
    """Marque 'expired' les sessions de paiement restées 'pending' au-delà de la durée
    de vie d'une session Stripe Checkout. Ne touche à aucun montant, ne modifie pas
    l'état d'une facture — purement un nettoyage de statut d'affichage."""
    cutoff_iso = (
        datetime.now(timezone.utc) - timedelta(hours=max_age_hours)
    ).isoformat()
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


def checks_needing_alert(checks: dict, alert_state: dict, now: datetime) -> list:
    """Décide quels contrôles en erreur doivent déclencher une alerte, en respectant
    un délai de rappel (ALERT_COOLDOWN_HOURS) pour éviter le spam. `alert_state` est
    mutée : les contrôles redevenus sains sont oubliés, ceux qui viennent d'alerter
    sont horodatés. Ne considère que les contrôles listés dans CHECK_LABELS_FR —
    les statuts "disabled"/"warning" (config optionnelle absente) ne sont pas des
    pannes et ne doivent pas alerter l'admin."""
    to_alert = []
    for name in CHECK_LABELS_FR:
        result = checks.get(name, {})
        if result.get("status") != "error":
            alert_state.pop(name, None)
            continue
        last = alert_state.get(name)
        if last and (now - last) < timedelta(hours=ALERT_COOLDOWN_HOURS):
            continue
        alert_state[name] = now
        to_alert.append((name, result))
    return to_alert


async def periodic_auto_fix_loop(
    db,
    *,
    stripe_sdk=None,
    uploads_dir=None,
    get_settings=None,
    send_alert=None,
    admin_email: str = None,
    interval_seconds: int = AUTO_FIX_INTERVAL_SECONDS,
):
    """Boucle en tâche de fond du process FastAPI — aucune infra externe (cron/Celery)
    requise. S'arrête proprement si la tâche est annulée (arrêt de l'app).

    `get_settings` est un callable async (typiquement settings_store.get_settings) relu
    à chaque itération, pour que les identifiants modifiés depuis l'admin soient pris en
    compte sans redémarrage. Si stripe_sdk/uploads_dir/get_settings/send_alert/admin_email
    sont fournis, envoie aussi une alerte (email, throttlée à une fois toutes les
    ALERT_COOLDOWN_HOURS par contrôle) quand un contrôle passe en erreur."""
    import asyncio

    alert_state = {}
    while True:
        try:
            await asyncio.sleep(interval_seconds)
            result = await run_auto_fixes(db)
            logger.info(f"Auto-fix périodique exécuté: {result}")

            if stripe_sdk and get_settings and send_alert and admin_email:
                settings = await get_settings(db)
                checks_result = await run_all_checks(
                    db=db,
                    stripe_sdk=stripe_sdk,
                    settings=settings,
                    uploads_dir=uploads_dir,
                )
                for name, res in checks_needing_alert(
                    checks_result["checks"], alert_state, datetime.now(timezone.utc)
                ):
                    label = CHECK_LABELS_FR.get(name, name)
                    await send_alert(
                        admin_email,
                        f"[E3C] Alerte diagnostic : {label}",
                        f"<p>Le contrôle <b>{label}</b> est en erreur.</p>"
                        f"<p>Détail : {res.get('detail', 'voir le tableau de bord admin')}</p>",
                    )
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Boucle d'auto-fix périodique en erreur: {e}")
