"""
Authenticated API Tests for Meal Planner App
Tests full CRUD operations with Firebase authentication
"""
import pytest
import requests
import os
from pathlib import Path
from datetime import datetime, timedelta

# Read EXPO_PUBLIC_BACKEND_URL from frontend/.env
def get_backend_url():
    env_file = Path('/app/frontend/.env')
    if env_file.exists():
        with open(env_file) as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    return 'https://foodie-kitchen.preview.emergentagent.com'

def get_firebase_config():
    """Read Firebase config from frontend/.env"""
    config = {}
    env_file = Path('/app/frontend/.env')
    if env_file.exists():
        with open(env_file) as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_FIREBASE_API_KEY='):
                    config['api_key'] = line.split('=', 1)[1].strip()
                elif line.startswith('EXPO_PUBLIC_FIREBASE_PROJECT_ID='):
                    config['project_id'] = line.split('=', 1)[1].strip()
    return config

BASE_URL = get_backend_url().rstrip('/')
FIREBASE_CONFIG = get_firebase_config()
FIREBASE_API_KEY = FIREBASE_CONFIG.get('api_key')

# Test credentials
TEST_EMAIL = "test@mealplanner.com"
TEST_PASSWORD = "Test123!"


@pytest.fixture(scope="session")
def firebase_token():
    """Get Firebase ID token using REST API"""
    if not FIREBASE_API_KEY:
        pytest.skip("Firebase API key not found in .env")
    
    # Try to sign in first
    signin_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}"
    signin_payload = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "returnSecureToken": True
    }
    
    try:
        response = requests.post(signin_url, json=signin_payload)
        if response.status_code == 200:
            data = response.json()
            token = data.get('idToken')
            print(f"\n✓ Firebase sign in successful for {TEST_EMAIL}")
            return token
        else:
            # If sign in fails, try to sign up
            signup_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={FIREBASE_API_KEY}"
            signup_payload = {
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "returnSecureToken": True
            }
            response = requests.post(signup_url, json=signup_payload)
            if response.status_code == 200:
                data = response.json()
                token = data.get('idToken')
                print(f"\n✓ Firebase sign up successful for {TEST_EMAIL}")
                return token
            else:
                pytest.skip(f"Failed to authenticate with Firebase: {response.text}")
    except Exception as e:
        pytest.skip(f"Firebase authentication error: {str(e)}")


@pytest.fixture
def auth_headers(firebase_token):
    """Return headers with Firebase token"""
    return {
        "Authorization": f"Bearer {firebase_token}",
        "Content-Type": "application/json"
    }


class TestAuthenticatedFlow:
    """Test authenticated endpoints"""
    
    def test_auth_verify(self, auth_headers):
        """Test POST /api/auth/verify with valid token"""
        response = requests.post(f"{BASE_URL}/api/auth/verify", headers=auth_headers)
        print(f"\n✓ POST /api/auth/verify - Status: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        print(f"  User verified: {data['user']['email']}")


class TestRecipesCRUD:
    """Test Recipe CRUD operations"""
    
    def test_create_and_get_recipe(self, auth_headers):
        """Test creating a recipe and verifying it persists"""
        # Create recipe
        recipe_payload = {
            "url": "https://www.youtube.com/watch?v=abc123",
            "title": "TEST_Chicken Tikka",
            "tags": ["indian", "spicy"],
            "ingredients": ["chicken", "yogurt", "spices"],
            "notes": "Test recipe for automated testing"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/recipes",
            headers=auth_headers,
            json=recipe_payload
        )
        print(f"\n✓ POST /api/recipes - Status: {create_response.status_code}")
        assert create_response.status_code == 200
        
        created_recipe = create_response.json()["recipe"]
        assert created_recipe["title"] == recipe_payload["title"]
        assert created_recipe["platform"] == "youtube"
        assert "indian" in created_recipe["tags"]
        recipe_id = created_recipe["id"]
        print(f"  Recipe created: {created_recipe['title']} (ID: {recipe_id})")
        
        # GET to verify persistence
        get_response = requests.get(f"{BASE_URL}/api/recipes", headers=auth_headers)
        print(f"✓ GET /api/recipes - Status: {get_response.status_code}")
        assert get_response.status_code == 200
        
        recipes = get_response.json()["recipes"]
        found = any(r["id"] == recipe_id for r in recipes)
        assert found, "Created recipe not found in GET /api/recipes"
        print(f"  Recipe verified in list")
        
        # Cleanup
        delete_response = requests.delete(
            f"{BASE_URL}/api/recipes/{recipe_id}",
            headers=auth_headers
        )
        assert delete_response.status_code == 200
        print(f"  Recipe cleaned up")
    
    def test_search_recipes(self, auth_headers):
        """Test recipe search"""
        response = requests.get(
            f"{BASE_URL}/api/recipes/search?q=chicken",
            headers=auth_headers
        )
        print(f"\n✓ GET /api/recipes/search?q=chicken - Status: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert "recipes" in data
        print(f"  Found {len(data['recipes'])} recipes")
    
    def test_get_tags(self, auth_headers):
        """Test getting all tags"""
        response = requests.get(f"{BASE_URL}/api/tags", headers=auth_headers)
        print(f"\n✓ GET /api/tags - Status: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert "tags" in data
        print(f"  Found {len(data['tags'])} tags")


class TestMealPlansCRUD:
    """Test Meal Plan operations"""
    
    def test_get_and_update_meal_plan(self, auth_headers):
        """Test getting and updating meal plan"""
        # Get current week
        today = datetime.now()
        week_start = (today - timedelta(days=today.weekday())).strftime('%Y-%m-%d')
        
        # GET meal plan
        get_response = requests.get(
            f"{BASE_URL}/api/meal-plans/{week_start}",
            headers=auth_headers
        )
        print(f"\n✓ GET /api/meal-plans/{week_start} - Status: {get_response.status_code}")
        assert get_response.status_code == 200
        
        meal_plan = get_response.json()["meal_plan"]
        assert "days" in meal_plan
        print(f"  Meal plan retrieved for week {week_start}")
        
        # Update meal plan with manual entry
        updated_days = meal_plan.get("days", {})
        if "monday" not in updated_days:
            updated_days["monday"] = {"breakfast": None, "lunch": None, "dinner": None}
        
        updated_days["monday"]["breakfast"] = {
            "recipe_id": None,
            "recipe_title": "TEST_Oatmeal",
            "recipe_url": None,
            "recipe_thumbnail": None
        }
        
        update_payload = {
            "week_start": week_start,
            "days": updated_days
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/meal-plans",
            headers=auth_headers,
            json=update_payload
        )
        print(f"✓ PUT /api/meal-plans - Status: {update_response.status_code}")
        assert update_response.status_code == 200
        
        updated_plan = update_response.json()["meal_plan"]
        assert updated_plan["days"]["monday"]["breakfast"]["recipe_title"] == "TEST_Oatmeal"
        print(f"  Meal plan updated: Monday breakfast = TEST_Oatmeal")
        
        # Verify persistence
        verify_response = requests.get(
            f"{BASE_URL}/api/meal-plans/{week_start}",
            headers=auth_headers
        )
        assert verify_response.status_code == 200
        verified_plan = verify_response.json()["meal_plan"]
        assert verified_plan["days"]["monday"]["breakfast"]["recipe_title"] == "TEST_Oatmeal"
        print(f"  Meal plan verified in database")


class TestGroceryListCRUD:
    """Test Grocery List operations"""
    
    def test_add_toggle_delete_grocery_item(self, auth_headers):
        """Test full grocery item lifecycle"""
        # Get current week
        today = datetime.now()
        week_start = (today - timedelta(days=today.weekday())).strftime('%Y-%m-%d')
        
        # Add item
        add_payload = {
            "name": "TEST_Rice",
            "quantity": "2 kg"
        }
        
        add_response = requests.post(
            f"{BASE_URL}/api/grocery-lists/{week_start}/items",
            headers=auth_headers,
            json=add_payload
        )
        print(f"\n✓ POST /api/grocery-lists/{week_start}/items - Status: {add_response.status_code}")
        assert add_response.status_code == 200
        
        grocery_list = add_response.json()["grocery_list"]
        items = grocery_list["items"]
        assert len(items) > 0
        
        # Find our test item
        test_item = next((item for item in items if item["name"] == "TEST_Rice"), None)
        assert test_item is not None
        assert test_item["quantity"] == "2 kg"
        assert test_item["checked"] is False
        item_id = test_item["id"]
        print(f"  Item added: {test_item['name']} - {test_item['quantity']} (ID: {item_id})")
        
        # Toggle item
        toggle_response = requests.put(
            f"{BASE_URL}/api/grocery-lists/{week_start}/items/{item_id}/toggle",
            headers=auth_headers
        )
        print(f"✓ PUT /api/grocery-lists/{week_start}/items/{item_id}/toggle - Status: {toggle_response.status_code}")
        assert toggle_response.status_code == 200
        
        toggled_list = toggle_response.json()["grocery_list"]
        toggled_item = next((item for item in toggled_list["items"] if item["id"] == item_id), None)
        assert toggled_item["checked"] is True
        print(f"  Item toggled: checked = {toggled_item['checked']}")
        
        # Delete item
        delete_response = requests.delete(
            f"{BASE_URL}/api/grocery-lists/{week_start}/items/{item_id}",
            headers=auth_headers
        )
        print(f"✓ DELETE /api/grocery-lists/{week_start}/items/{item_id} - Status: {delete_response.status_code}")
        assert delete_response.status_code == 200
        
        deleted_list = delete_response.json()["grocery_list"]
        remaining_item = next((item for item in deleted_list["items"] if item["id"] == item_id), None)
        assert remaining_item is None
        print(f"  Item deleted successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
