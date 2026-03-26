# Our Kitchen - Meal Planner App

## Overview
A meal planning app for couples to save recipes from social media, plan weekly meals together, and manage shared grocery lists — all synced in real-time between both phones.

## Features
### 1. Recipe Library
- Save recipe links from **Instagram**, **YouTube**, and **Facebook**
- Auto-detect platform from URL
- Add custom **tags** (e.g., spicy, vegan, protein, indian)
- Add **ingredients** for each recipe
- Search recipes by title, ingredient, or tag
- Filter by tags

### 2. Weekly Meal Planner
- **3 meals/day × 7 days** grid (Breakfast, Lunch, Dinner)
- Navigate between weeks (previous/next arrows)
- Assign saved recipes to meal slots
- Tap to open original recipe video/link
- Clear meal slots easily

### 3. Shared Grocery Checklist
- One grocery list per week
- Add items with optional quantity
- **Checkbox to cross off** items when bought (strikethrough + fade)
- Progress bar showing items bought vs total
- Delete items
- Week navigation to plan ahead

### 4. Authentication & Sharing
- **Firebase Google Auth** for login
- **Demo account** available (demo@mealplanner.com / Demo123!)
- Shared login = same data on both phones
- Real-time sync via shared MongoDB backend

## Tech Stack
- **Frontend**: Expo React Native (SDK 54) with expo-router
- **Backend**: FastAPI + MongoDB
- **Auth**: Firebase Authentication
- **Design**: Editorial Cookbook theme (warm sand, deep forest green, terracotta accents)

## Architecture
```
Frontend (Expo) → Firebase Auth → Backend (FastAPI) → MongoDB
                                                    ↕
                    Both phones share same Firebase account
                    = same data visible everywhere
```

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/verify | Verify Firebase token, upsert user |
| GET | /api/recipes | List all recipes |
| POST | /api/recipes | Create recipe |
| PUT | /api/recipes/:id | Update recipe |
| DELETE | /api/recipes/:id | Delete recipe |
| GET | /api/recipes/search | Search by query/tag |
| GET | /api/meal-plans/:week | Get weekly meal plan |
| PUT | /api/meal-plans | Update meal plan |
| GET | /api/grocery-lists/:week | Get grocery list |
| PUT | /api/grocery-lists | Update grocery list |
| POST | /api/grocery-lists/:week/items | Add grocery item |
| PUT | /api/grocery-lists/:week/items/:id/toggle | Toggle checked |
| DELETE | /api/grocery-lists/:week/items/:id | Delete item |
| GET | /api/tags | Get all used tags |

## How to Use
1. **Login**: Use Google Sign-In or Demo Account
2. **Save Recipes**: Tap the + button on Recipes tab → paste link → add tags & ingredients → Save
3. **Plan Meals**: Go to Planner tab → tap a meal slot → pick a recipe from your library
4. **Grocery Shopping**: Go to Grocery tab → add items → check them off while shopping
5. **Share with Partner**: Both use the same login credentials for synced data
