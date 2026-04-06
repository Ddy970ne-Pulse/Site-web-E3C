"""Router galerie photos."""
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form
from pydantic import BaseModel

router = APIRouter(prefix="/gallery", tags=["gallery"])

ALLOWED_IMG = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_MB = 10


class GalleryImageMeta(BaseModel):
    label: str
    category: str


def _init(db, uploads_dir: Path):
    """Injecté depuis main.py."""
    router.db = db
    router.uploads_dir = uploads_dir


@router.post("")
async def upload_gallery_image(
    request: Request,
    file: UploadFile = File(...),
    label: str = Form(...),
    category: str = Form(...),
):
    from deps import require_admin
    await require_admin(request, router.db)

    if file.content_type not in ALLOWED_IMG:
        raise HTTPException(400, "Format non supporté. JPEG, PNG ou WEBP uniquement.")
    data = await file.read()
    if len(data) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(400, f"Fichier trop volumineux (max {MAX_SIZE_MB} Mo).")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = router.uploads_dir / filename
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
    await router.db.gallery.insert_one({**doc, "_id": doc["id"]})
    return doc


@router.get("")
async def list_gallery():
    imgs = await router.db.gallery.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return imgs


@router.delete("/{img_id}")
async def delete_gallery_image(img_id: str, request: Request):
    from deps import require_admin
    await require_admin(request, router.db)

    img = await router.db.gallery.find_one({"id": img_id}, {"_id": 0})
    if not img:
        raise HTTPException(404, "Image introuvable")
    try:
        (router.uploads_dir / img["filename"]).unlink(missing_ok=True)
    except Exception:
        pass
    await router.db.gallery.delete_one({"id": img_id})
    return {"message": "Image supprimée"}
