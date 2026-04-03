from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Annotated
from bson import ObjectId
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ContactForm(BaseModel):
    name: str
    phone: str
    commune: str
    service: str
    message: Optional[str] = ""
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ContactResponse(BaseModel):
    id: str
    name: str
    phone: str
    commune: str
    service: str
    message: Optional[str] = ""
    submitted_at: str


@api_router.get("/")
async def root():
    return {"message": "E3C API is running"}


@api_router.post("/contact", response_model=ContactResponse)
async def submit_contact(form: ContactForm):
    doc = form.model_dump()
    doc['id'] = str(uuid.uuid4())
    doc['submitted_at'] = doc['submitted_at'].isoformat()
    await db.contacts.insert_one({**doc, '_id': doc['id']})
    return ContactResponse(**doc)


@api_router.get("/contact", response_model=List[ContactResponse])
async def get_contacts():
    contacts = await db.contacts.find({}, {"_id": 0}).to_list(1000)
    return contacts


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
