# 🍽️ Our Kitchen - Meal Planner for Couples

A meal planning web app for you and your partner. Save recipes from Instagram, YouTube & Facebook, plan weekly meals together, and manage a shared grocery checklist — all synced in real-time.

## Features

- **Recipe Library** — Save links from Instagram, YouTube & Facebook with custom tags and ingredients
- **Weekly Meal Planner** — 3 meals/day × 7 days grid, assign recipes to each slot
- **Shared Grocery Checklist** — Add items, check them off while shopping, progress tracking
- **Firebase Auth** — Google Sign-In or email/password, shared login for couples
- **Real-time Sync** — Same data on both phones via shared account

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Expo (React Native for Web), expo-router |
| Backend | FastAPI (Python) |
| Database | MongoDB |
| Auth | Firebase Authentication |
| Hosting | Vercel |

## Quick Start (Development)

```bash
# Frontend
cd frontend && yarn install && yarn start

# Backend
cd backend && pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

## Deploy to Vercel

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for a complete step-by-step guide.

## Project Structure

```
├── api/index.py           # Backend API (Vercel serverless)
├── frontend/app/          # Expo Router screens
├── frontend/src/          # Firebase config, API service, auth
├── backend/server.py      # Backend (development server)
├── vercel.json            # Vercel deployment config
└── DEPLOYMENT.md          # Deployment guide
```

## License

Private — built with love for couples who cook together 🧑‍🍳👩‍🍳
