"""Router grille tarifaire."""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/pricing-grid", tags=["pricing"])


class PricingItemCreate(BaseModel):
    category: str
    description: str
    unit: str
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


def _init(db):
    router.db = db


@router.get("")
async def list_pricing():
    items = await router.db.pricing_grid.find(
        {}, {"_id": 0}
    ).sort([("category", 1), ("description", 1)]).to_list(500)
    return items


@router.post("")
async def create_pricing_item(body: PricingItemCreate, request: Request):
    from deps import require_admin
    await require_admin(request, router.db)
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
    await router.db.pricing_grid.insert_one({**doc, "_id": doc["id"]})
    return doc


@router.put("/{item_id}")
async def update_pricing_item(item_id: str, body: PricingItemUpdate, request: Request):
    from deps import require_admin
    await require_admin(request, router.db)
    update = {k: v for k, v in body.dict().items() if v is not None}
    if "unit_price_ht" in update:
        update["unit_price_ht"] = round(update["unit_price_ht"], 2)
    if not update:
        raise HTTPException(400, "Aucun champ à mettre à jour")
    await router.db.pricing_grid.update_one({"id": item_id}, {"$set": update})
    item = await router.db.pricing_grid.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(404, "Article introuvable")
    return item


@router.delete("/{item_id}")
async def delete_pricing_item(item_id: str, request: Request):
    from deps import require_admin
    await require_admin(request, router.db)
    result = await router.db.pricing_grid.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Article introuvable")
    return {"message": "Article supprimé"}
