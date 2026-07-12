"""Intégration PayPal Orders API v2 (REST direct via httpx — pas de SDK PayPal,
cohérent avec le reste du projet). Miroir du flux Stripe Checkout existant :
créer une commande, rediriger le client vers PayPal pour approbation, capturer
au retour.
"""
import httpx


def _base_url(mode: str) -> str:
    return "https://api-m.paypal.com" if mode == "live" else "https://api-m.sandbox.paypal.com"


async def get_access_token(client_id: str, client_secret: str, mode: str) -> str:
    async with httpx.AsyncClient() as c:
        r = await c.post(
            f"{_base_url(mode)}/v1/oauth2/token",
            auth=(client_id, client_secret),
            data={"grant_type": "client_credentials"},
            timeout=10,
        )
        r.raise_for_status()
        return r.json()["access_token"]


async def create_order(client_id: str, client_secret: str, mode: str, *, amount: float,
                        currency: str, reference_id: str, return_url: str, cancel_url: str) -> dict:
    token = await get_access_token(client_id, client_secret, mode)
    async with httpx.AsyncClient() as c:
        r = await c.post(
            f"{_base_url(mode)}/v2/checkout/orders",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={
                "intent": "CAPTURE",
                "purchase_units": [{
                    "reference_id": reference_id,
                    "amount": {"currency_code": currency.upper(), "value": f"{amount:.2f}"},
                }],
                "application_context": {
                    "return_url": return_url,
                    "cancel_url": cancel_url,
                    "user_action": "PAY_NOW",
                },
            },
            timeout=15,
        )
        r.raise_for_status()
        data = r.json()
    approve_url = next((l["href"] for l in data.get("links", []) if l.get("rel") == "approve"), None)
    return {"order_id": data["id"], "approve_url": approve_url}


async def capture_order(client_id: str, client_secret: str, mode: str, order_id: str) -> dict:
    token = await get_access_token(client_id, client_secret, mode)
    async with httpx.AsyncClient() as c:
        r = await c.post(
            f"{_base_url(mode)}/v2/checkout/orders/{order_id}/capture",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            timeout=15,
        )
        r.raise_for_status()
        return r.json()
