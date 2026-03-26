# Our Kitchen - Meal Planner App PRD

## Overview
Meal planning web app for couples. Save recipes from social media, plan weekly meals, manage shared grocery lists.

## Features
1. **Recipe Library**: Save Instagram/YouTube/Facebook links, custom tags, ingredients
2. **Weekly Meal Planner**: 3 meals/day × 7 days, assign recipes to slots
3. **Shared Grocery Checklist**: Add items, check off when bought, progress bar
4. **Firebase Auth**: Google Sign-In + email/password, shared login
5. **Real-time Sync**: Same data on both devices via shared account

## Tech Stack
- Frontend: Expo React Native (web + mobile), expo-router
- Backend: FastAPI + MongoDB
- Auth: Firebase Authentication
- Hosting: Vercel (configured)

## Deployment
- **Vercel config**: `vercel.json` at root, `api/index.py` serverless function
- **GitHub export**: Use "Save to GitHub" button on Emergent platform
- **Full guide**: See `DEPLOYMENT.md`

## API Endpoints
All require Firebase Bearer token auth.
- POST /api/auth/verify
- GET/POST/PUT/DELETE /api/recipes
- GET/PUT /api/meal-plans/{week}
- GET/PUT/POST/DELETE /api/grocery-lists/{week}
- GET /api/tags

## Environment Variables (Vercel)
- MONGO_URL, DB_NAME, FIREBASE_PROJECT_ID
- EXPO_PUBLIC_FIREBASE_* (6 variables)
- EXPO_PUBLIC_BACKEND_URL
