from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'meal_planner')]

# Firebase Admin SDK initialization (using project credentials)
('''FIREBASE_PROJECT_ID = os.environ.get('FIREBASE_PROJECT_ID', 'meal-planner-8cff4')

if not firebase_admin._apps:
    firebase_app = firebase_admin.initialize_app(options={
        'projectId': FIREBASE_PROJECT_ID,
    })

app = FastAPI()
api_router = APIRouter(prefix="/api")''')

FIREBASE_PROJECT_ID = os.environ.get('FIREBASE_PROJECT_ID', 'meal-planner-8cff4')
cred_json = os.environ.get("FIREBASE_CREDENTIALS")

if not cred_json:
    raise Exception("FIREBASE_CREDENTIALS is missing in environment")

if not firebase_admin._apps:
    cred = credentials.Certificate(json.loads(cred_json))
    firebase_app = firebase_admin.initialize_app(cred, {
        'projectId': FIREBASE_PROJECT_ID,
    })

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ---- Pydantic Models ----

class UserProfile(BaseModel):
    uid: str
    email: str
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class RecipeCreate(BaseModel):
    url: str
    title: str
    platform: str = "other"
    tags: List[str] = []
    ingredients: List[str] = []
    notes: Optional[str] = None
    thumbnail: Optional[str] = None

class RecipeUpdate(BaseModel):
    title: Optional[str] = None
    tags: Optional[List[str]] = None
    ingredients: Optional[List[str]] = None
    notes: Optional[str] = None
    thumbnail: Optional[str] = None

class MealSlot(BaseModel):
    recipe_id: Optional[str] = None
    recipe_title: Optional[str] = None
    recipe_url: Optional[str] = None
    recipe_thumbnail: Optional[str] = None

class DayPlan(BaseModel):
    breakfast: Optional[MealSlot] = None
    lunch: Optional[MealSlot] = None
    dinner: Optional[MealSlot] = None

class MealPlanUpdate(BaseModel):
    week_start: str  # ISO date string for Monday of the week
    days: dict  # {"monday": DayPlan, "tuesday": DayPlan, ...}

class GroceryItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    quantity: Optional[str] = None
    checked: bool = False
    category: Optional[str] = None

class GroceryListUpdate(BaseModel):
    week_start: str
    items: List[GroceryItem]

class AddGroceryItem(BaseModel):
    name: str
    quantity: Optional[str] = None
    category: Optional[str] = None

# ---- Auth Dependency ----

async def verify_firebase_token(authorization: str = Header(...)) -> dict:
    """Verify Firebase ID token from Authorization header."""
    try:
        token = authorization.replace("Bearer ", "")
        decoded_token = firebase_auth.verify_id_token(token, check_revoked=False)
        return decoded_token
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Token expired")
    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.error(f"Auth error: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed")

# ---- Auth Endpoints ----

@api_router.post("/auth/verify")
async def verify_auth(authorization: str = Header(...)):
    """Verify token and upsert user profile."""
    decoded = await verify_firebase_token(authorization)
    uid = decoded.get("uid")
    email = decoded.get("email", "")
    name = decoded.get("name", "")
    picture = decoded.get("picture", "")

    user_data = {
        "uid": uid,
        "email": email,
        "display_name": name,
        "photo_url": picture,
        "last_login": datetime.now(timezone.utc).isoformat()
    }

    await db.users.update_one(
        {"uid": uid},
        {"$set": user_data, "$setOnInsert": {"created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )

    user = await db.users.find_one({"uid": uid}, {"_id": 0})
    return {"user": user}

# ---- Recipe Endpoints ----

def detect_platform(url: str) -> str:
    if "instagram.com" in url or "instagr.am" in url:
        return "instagram"
    elif "youtube.com" in url or "youtu.be" in url:
        return "youtube"
    elif "facebook.com" in url or "fb.watch" in url:
        return "facebook"
    return "other"

@api_router.get("/recipes")
async def get_recipes(user: dict = Depends(verify_firebase_token)):
    uid = user["uid"]
    recipes = await db.recipes.find({"uid": uid}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"recipes": recipes}

@api_router.post("/recipes")
async def create_recipe(recipe: RecipeCreate, user: dict = Depends(verify_firebase_token)):
    uid = user["uid"]
    recipe_id = str(uuid.uuid4())
    platform = detect_platform(recipe.url)

    recipe_doc = {
        "id": recipe_id,
        "uid": uid,
        "url": recipe.url,
        "title": recipe.title,
        "platform": platform,
        "tags": recipe.tags,
        "ingredients": recipe.ingredients,
        "notes": recipe.notes,
        "thumbnail": recipe.thumbnail,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

    await db.recipes.insert_one(recipe_doc)
    del recipe_doc["_id"]
    return {"recipe": recipe_doc}

@api_router.put("/recipes/{recipe_id}")
async def update_recipe(recipe_id: str, update: RecipeUpdate, user: dict = Depends(verify_firebase_token)):
    uid = user["uid"]
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    result = await db.recipes.update_one(
        {"id": recipe_id, "uid": uid},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Recipe not found")

    recipe = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
    return {"recipe": recipe}

@api_router.delete("/recipes/{recipe_id}")
async def delete_recipe(recipe_id: str, user: dict = Depends(verify_firebase_token)):
    uid = user["uid"]
    result = await db.recipes.delete_one({"id": recipe_id, "uid": uid})
    if result.deleted_count == 0:
        raise HTTPException(404, "Recipe not found")
    return {"message": "Recipe deleted"}

@api_router.get("/recipes/search")
async def search_recipes(q: str = "", tag: str = "", user: dict = Depends(verify_firebase_token)):
    uid = user["uid"]
    query = {"uid": uid}

    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"ingredients": {"$regex": q, "$options": "i"}},
            {"notes": {"$regex": q, "$options": "i"}}
        ]
    if tag:
        query["tags"] = tag

    recipes = await db.recipes.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"recipes": recipes}

# ---- Meal Plan Endpoints ----

@api_router.get("/meal-plans/{week_start}")
async def get_meal_plan(week_start: str, user: dict = Depends(verify_firebase_token)):
    uid = user["uid"]
    plan = await db.meal_plans.find_one({"uid": uid, "week_start": week_start}, {"_id": 0})

    if not plan:
        empty_days = {}
        for day in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]:
            empty_days[day] = {"breakfast": None, "lunch": None, "dinner": None}
        plan = {"uid": uid, "week_start": week_start, "days": empty_days}

    return {"meal_plan": plan}

@api_router.put("/meal-plans")
async def update_meal_plan(plan: MealPlanUpdate, user: dict = Depends(verify_firebase_token)):
    uid = user["uid"]
    plan_doc = {
        "uid": uid,
        "week_start": plan.week_start,
        "days": plan.days,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

    await db.meal_plans.update_one(
        {"uid": uid, "week_start": plan.week_start},
        {"$set": plan_doc, "$setOnInsert": {"created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )

    saved = await db.meal_plans.find_one({"uid": uid, "week_start": plan.week_start}, {"_id": 0})
    return {"meal_plan": saved}

# ---- Grocery List Endpoints ----

@api_router.get("/grocery-lists/{week_start}")
async def get_grocery_list(week_start: str, user: dict = Depends(verify_firebase_token)):
    uid = user["uid"]
    grocery = await db.grocery_lists.find_one({"uid": uid, "week_start": week_start}, {"_id": 0})
    if not grocery:
        grocery = {"uid": uid, "week_start": week_start, "items": []}
    return {"grocery_list": grocery}

@api_router.put("/grocery-lists")
async def update_grocery_list(data: GroceryListUpdate, user: dict = Depends(verify_firebase_token)):
    uid = user["uid"]
    items = [item.dict() for item in data.items]
    doc = {
        "uid": uid,
        "week_start": data.week_start,
        "items": items,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

    await db.grocery_lists.update_one(
        {"uid": uid, "week_start": data.week_start},
        {"$set": doc, "$setOnInsert": {"created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )

    saved = await db.grocery_lists.find_one({"uid": uid, "week_start": data.week_start}, {"_id": 0})
    return {"grocery_list": saved}

@api_router.post("/grocery-lists/{week_start}/items")
async def add_grocery_item(week_start: str, item: AddGroceryItem, user: dict = Depends(verify_firebase_token)):
    uid = user["uid"]
    new_item = {
        "id": str(uuid.uuid4()),
        "name": item.name,
        "quantity": item.quantity,
        "checked": False,
        "category": item.category
    }

    # Ensure list exists
    existing = await db.grocery_lists.find_one({"uid": uid, "week_start": week_start})
    if not existing:
        await db.grocery_lists.insert_one({
            "uid": uid,
            "week_start": week_start,
            "items": [new_item],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
    else:
        await db.grocery_lists.update_one(
            {"uid": uid, "week_start": week_start},
            {"$push": {"items": new_item}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
        )

    saved = await db.grocery_lists.find_one({"uid": uid, "week_start": week_start}, {"_id": 0})
    return {"grocery_list": saved}

@api_router.put("/grocery-lists/{week_start}/items/{item_id}/toggle")
async def toggle_grocery_item(week_start: str, item_id: str, user: dict = Depends(verify_firebase_token)):
    uid = user["uid"]
    grocery = await db.grocery_lists.find_one({"uid": uid, "week_start": week_start})
    if not grocery:
        raise HTTPException(404, "Grocery list not found")

    items = grocery.get("items", [])
    for item in items:
        if item["id"] == item_id:
            item["checked"] = not item["checked"]
            break

    await db.grocery_lists.update_one(
        {"uid": uid, "week_start": week_start},
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    saved = await db.grocery_lists.find_one({"uid": uid, "week_start": week_start}, {"_id": 0})
    return {"grocery_list": saved}

@api_router.delete("/grocery-lists/{week_start}/items/{item_id}")
async def delete_grocery_item(week_start: str, item_id: str, user: dict = Depends(verify_firebase_token)):
    uid = user["uid"]
    await db.grocery_lists.update_one(
        {"uid": uid, "week_start": week_start},
        {"$pull": {"items": {"id": item_id}}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    saved = await db.grocery_lists.find_one({"uid": uid, "week_start": week_start}, {"_id": 0})
    return {"grocery_list": saved}

# ---- Tags Endpoint ----

@api_router.get("/tags")
async def get_all_tags(user: dict = Depends(verify_firebase_token)):
    uid = user["uid"]
    recipes = await db.recipes.find({"uid": uid}, {"tags": 1, "_id": 0}).to_list(500)
    all_tags = set()
    for r in recipes:
        for t in r.get("tags", []):
            all_tags.add(t)
    return {"tags": sorted(list(all_tags))}

# ---- Health Check ----

@api_router.get("/")
async def root():
    return {"message": "Meal Planner API is running"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
