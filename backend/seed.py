"""
Seed script — populates the campus_canteen database with sample menu items.

Usage:
    cd backend
    python seed.py
"""

import asyncio
import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

# Allow running without a full .env by falling back to localhost
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/campus_canteen")
USE_TLS = not MONGODB_URL.startswith("mongodb://localhost")

from app.models.models import MenuItem, MealCategory, Ingredient, UserProfile, Order  # noqa: E402


SAMPLE_ITEMS = [
    {
        "name": "Masala Oatmeal Bowl",
        "description": "Rolled oats with turmeric, ginger, roasted chickpeas and fresh coriander.",
        "price": 3.50,
        "calories": 380,
        "protein": 14,
        "carbs": 58,
        "fat": 9,
        "fiber": 8,
        "image_url": "https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=600&q=80",
        "category": MealCategory.BREAKFAST,
        "is_available": True,
        "is_vegetarian": True,
        "is_vegan": True,
        "preparation_time": 5,
        "ingredients": [
            Ingredient(name="Rolled Oats", is_allergen=True, allergen_type="gluten"),
            Ingredient(name="Chickpeas", is_allergen=False),
        ],
    },
    {
        "name": "Grilled Chicken Rice Bowl",
        "description": "Herb-marinated chicken breast, steamed jasmine rice, cucumber raita.",
        "price": 6.75,
        "calories": 620,
        "protein": 42,
        "carbs": 65,
        "fat": 14,
        "fiber": 3,
        "image_url": "https://images.unsplash.com/photo-1604908177453-7462950a6a3b?w=600&q=80",
        "category": MealCategory.LUNCH,
        "is_available": True,
        "is_vegetarian": False,
        "is_vegan": False,
        "preparation_time": 12,
        "ingredients": [
            Ingredient(name="Chicken Breast", is_allergen=False),
            Ingredient(name="Dairy (Yogurt)", is_allergen=True, allergen_type="dairy"),
        ],
    },
    {
        "name": "Paneer Tikka Wrap",
        "description": "Smoky cottage cheese, mint chutney and pickled onions in a wholemeal wrap.",
        "price": 5.20,
        "calories": 490,
        "protein": 22,
        "carbs": 54,
        "fat": 18,
        "fiber": 5,
        "image_url": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80",
        "category": MealCategory.LUNCH,
        "is_available": True,
        "is_vegetarian": True,
        "is_vegan": False,
        "preparation_time": 8,
        "ingredients": [
            Ingredient(name="Wheat Wrap", is_allergen=True, allergen_type="gluten"),
            Ingredient(name="Paneer", is_allergen=True, allergen_type="dairy"),
        ],
    },
    {
        "name": "Mango Lassi",
        "description": "Chilled Alphonso mango blended with cold-set yogurt and a pinch of cardamom.",
        "price": 2.50,
        "calories": 210,
        "protein": 6,
        "carbs": 38,
        "fat": 4,
        "fiber": 1,
        "image_url": "https://images.unsplash.com/photo-1587883012610-e3df17d41270?w=600&q=80",
        "category": MealCategory.BEVERAGES,
        "is_available": True,
        "is_vegetarian": True,
        "is_vegan": False,
        "preparation_time": 3,
        "ingredients": [
            Ingredient(name="Yogurt", is_allergen=True, allergen_type="dairy"),
            Ingredient(name="Mango", is_allergen=False),
        ],
    },
    {
        "name": "Roasted Peanut Chaat",
        "description": "Crispy puffed rice, peanuts, tamarind glaze and fresh pomegranate seeds.",
        "price": 2.20,
        "calories": 290,
        "protein": 9,
        "carbs": 42,
        "fat": 10,
        "fiber": 4,
        "image_url": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80",
        "category": MealCategory.SNACKS,
        "is_available": True,
        "is_vegetarian": True,
        "is_vegan": True,
        "preparation_time": 4,
        "ingredients": [
            Ingredient(name="Peanuts", is_allergen=True, allergen_type="nuts"),
            Ingredient(name="Puffed Rice", is_allergen=False),
        ],
    },
    {
        "name": "Dal Makhani & Naan",
        "description": "Slow-simmered black lentils in a rich tomato-butter sauce with two naan.",
        "price": 5.80,
        "calories": 720,
        "protein": 24,
        "carbs": 88,
        "fat": 26,
        "fiber": 12,
        "image_url": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80",
        "category": MealCategory.DINNER,
        "is_available": True,
        "is_vegetarian": True,
        "is_vegan": False,
        "preparation_time": 10,
        "ingredients": [
            Ingredient(name="Butter", is_allergen=True, allergen_type="dairy"),
            Ingredient(name="Wheat Naan", is_allergen=True, allergen_type="gluten"),
        ],
    },
    {
        "name": "Veggie Biryani",
        "description": "Fragrant basmati rice cooked with seasonal vegetables and whole spices.",
        "price": 4.90,
        "calories": 550,
        "protein": 12,
        "carbs": 95,
        "fat": 11,
        "fiber": 7,
        "image_url": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80",
        "category": MealCategory.LUNCH,
        "is_available": True,
        "is_vegetarian": True,
        "is_vegan": True,
        "preparation_time": 15,
        "ingredients": [
            Ingredient(name="Basmati Rice", is_allergen=False),
            Ingredient(name="Mixed Vegetables", is_allergen=False),
        ],
    },
    {
        "name": "Cold Brew Coffee",
        "description": "12-hour cold-steeped single-origin coffee served over ice.",
        "price": 1.80,
        "calories": 15,
        "protein": 0,
        "carbs": 3,
        "fat": 0,
        "fiber": 0,
        "image_url": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80",
        "category": MealCategory.BEVERAGES,
        "is_available": True,
        "is_vegetarian": True,
        "is_vegan": True,
        "preparation_time": 2,
        "ingredients": [
            Ingredient(name="Coffee", is_allergen=False),
        ],
    },
    {
        "name": "Egg Bhurji Toast",
        "description": "Spiced scrambled eggs with onion, tomato and green chilli on toasted sourdough.",
        "price": 4.20,
        "calories": 430,
        "protein": 22,
        "carbs": 38,
        "fat": 18,
        "fiber": 3,
        "image_url": "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&q=80",
        "category": MealCategory.BREAKFAST,
        "is_available": True,
        "is_vegetarian": True,
        "is_vegan": False,
        "preparation_time": 7,
        "ingredients": [
            Ingredient(name="Eggs", is_allergen=True, allergen_type="eggs"),
            Ingredient(name="Sourdough Bread", is_allergen=True, allergen_type="gluten"),
        ],
    },
    {
        "name": "Fruit & Nut Granola Cup",
        "description": "House-made granola with Greek yogurt, seasonal berries and a honey drizzle.",
        "price": 3.10,
        "calories": 340,
        "protein": 11,
        "carbs": 52,
        "fat": 9,
        "fiber": 5,
        "image_url": "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=600&q=80",
        "category": MealCategory.BREAKFAST,
        "is_available": True,
        "is_vegetarian": True,
        "is_vegan": False,
        "preparation_time": 3,
        "ingredients": [
            Ingredient(name="Oats", is_allergen=True, allergen_type="gluten"),
            Ingredient(name="Greek Yogurt", is_allergen=True, allergen_type="dairy"),
            Ingredient(name="Mixed Nuts", is_allergen=True, allergen_type="nuts"),
        ],
    },
]


async def seed():
    client_kwargs = {"serverSelectionTimeoutMS": 10000}
    if USE_TLS:
        client_kwargs.update({"tls": True, "tlsCAFile": certifi.where()})

    client = AsyncIOMotorClient(MONGODB_URL, **client_kwargs)
    db_name = MONGODB_URL.rstrip("/").split("/")[-1].split("?")[0]

    await init_beanie(
        database=client[db_name],
        document_models=[UserProfile, MenuItem],
    )

    existing = await MenuItem.find_all().count()
    if existing > 0:
        print(f"Database already has {existing} menu item(s). Skipping seed.")
        print("To re-seed, drop the 'menu_items' collection first.")
        client.close()
        return

    items = [MenuItem(**item) for item in SAMPLE_ITEMS]
    await MenuItem.insert_many(items)
    print(f"Seeded {len(items)} menu items successfully.")
    client.close()


if __name__ == "__main__":
    # Load .env if present
    try:
        from dotenv import load_dotenv
        load_dotenv()
        MONGODB_URL = os.getenv("MONGODB_URL", MONGODB_URL)
        USE_TLS = not MONGODB_URL.startswith("mongodb://localhost")
    except ImportError:
        pass

    asyncio.run(seed())
