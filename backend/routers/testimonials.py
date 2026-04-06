"""Router témoignages."""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/testimonials", tags=["testimonials"])


class TestimonialCreate(BaseModel):
    name: str
    commune: Optional[str] = ""
    service: Optional[str] = ""
    stars: int = 5
    text: str
    email: Optional[str] = ""


def _init(db):
    router.db = db


@router.post("")
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
    await router.db.testimonials.insert_one({**doc, "_id": doc["id"]})
    return {"message": "Témoignage soumis. Il sera publié après validation.", "id": doc["id"]}


@router.get("")
async def list_testimonials():
    docs = await router.db.testimonials.find(
        {"status": "approved"}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return docs


@router.get("/admin")
async def list_testimonials_admin(request: Request):
    from deps import require_admin
    await require_admin(request, router.db)
    docs = await router.db.testimonials.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return docs


@router.patch("/{t_id}")
async def update_testimonial_status(t_id: str, request: Request):
    from deps import require_admin
    await require_admin(request, router.db)
    body = await request.json()
    status = body.get("status")
    if status not in ("approved", "rejected", "pending"):
        raise HTTPException(400, "Statut invalide")
    await router.db.testimonials.update_one({"id": t_id}, {"$set": {"status": status}})
    return {"message": "Statut mis à jour"}
