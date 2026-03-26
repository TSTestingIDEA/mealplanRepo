"""
Backend API Tests for Meal Planner App
Tests: Health checks, Firebase Auth, Recipes, Meal Plans, Grocery Lists
"""
import pytest
import requests
import os
from pathlib import Path

# Read EXPO_PUBLIC_BACKEND_URL from frontend/.env
def get_backend_url():
    env_file = Path('/app/frontend/.env')
    if env_file.exists():
        with open(env_file) as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    return 'https://foodie-kitchen.preview.emergentagent.com'

BASE_URL = get_backend_url().rstrip('/')

# Firebase setup for test token generation
FIREBASE_PROJECT_ID = "meal-planner-8cff4"

class TestHealthChecks:
    """Health check endpoints - no auth required"""
    
    def test_root_health(self):
        """Test GET /api/ returns 200"""
        response = requests.get(f"{BASE_URL}/api/")
        print(f"✓ GET /api/ - Status: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"  Response: {data}")
    
    def test_health_endpoint(self):
        """Test GET /api/health returns 200"""
        response = requests.get(f"{BASE_URL}/api/health")
        print(f"✓ GET /api/health - Status: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"
        print(f"  Response: {data}")


class TestAuthFlow:
    """Authentication flow tests"""
    
    @pytest.fixture(scope="class")
    def demo_token(self):
        """Get Firebase ID token for demo account"""
        # Note: This requires Firebase Admin SDK with proper credentials
        # For now, we'll skip token generation and test with manual token
        # In real scenario, you'd use Firebase REST API to get token
        pytest.skip("Firebase token generation requires Firebase REST API or manual token")
        return None
    
    def test_auth_verify_without_token(self):
        """Test /api/auth/verify without token returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/verify")
        print(f"✓ POST /api/auth/verify (no token) - Status: {response.status_code}")
        assert response.status_code in [401, 422]  # 422 if header missing, 401 if invalid
        print(f"  Expected 401/422 for missing auth")


class TestRecipesAPI:
    """Recipe CRUD operations - requires auth token"""
    
    def test_get_recipes_without_auth(self):
        """Test GET /api/recipes without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/recipes")
        print(f"✓ GET /api/recipes (no auth) - Status: {response.status_code}")
        assert response.status_code in [401, 422]
        print(f"  Expected 401/422 for missing auth")
    
    def test_create_recipe_without_auth(self):
        """Test POST /api/recipes without auth returns 401"""
        payload = {
            "url": "https://www.youtube.com/watch?v=test",
            "title": "Test Recipe",
            "tags": ["test"],
            "ingredients": ["test ingredient"]
        }
        response = requests.post(f"{BASE_URL}/api/recipes", json=payload)
        print(f"✓ POST /api/recipes (no auth) - Status: {response.status_code}")
        assert response.status_code in [401, 422]
        print(f"  Expected 401/422 for missing auth")


class TestMealPlansAPI:
    """Meal plan operations - requires auth token"""
    
    def test_get_meal_plan_without_auth(self):
        """Test GET /api/meal-plans/{week_start} without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/meal-plans/2026-01-13")
        print(f"✓ GET /api/meal-plans/2026-01-13 (no auth) - Status: {response.status_code}")
        assert response.status_code in [401, 422]
        print(f"  Expected 401/422 for missing auth")


class TestGroceryListsAPI:
    """Grocery list operations - requires auth token"""
    
    def test_get_grocery_list_without_auth(self):
        """Test GET /api/grocery-lists/{week_start} without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/grocery-lists/2026-01-13")
        print(f"✓ GET /api/grocery-lists/2026-01-13 (no auth) - Status: {response.status_code}")
        assert response.status_code in [401, 422]
        print(f"  Expected 401/422 for missing auth")


class TestTagsAPI:
    """Tags endpoint - requires auth token"""
    
    def test_get_tags_without_auth(self):
        """Test GET /api/tags without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/tags")
        print(f"✓ GET /api/tags (no auth) - Status: {response.status_code}")
        assert response.status_code in [401, 422]
        print(f"  Expected 401/422 for missing auth")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
