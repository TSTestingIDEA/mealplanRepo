# 🍽️ Our Kitchen - Deployment Guide

## Architecture

```
Your Phone  →  Vercel (Frontend)  →  Render (Backend API)  →  MongoDB Atlas (Database)
                  Static web app        FastAPI server           Cloud database
```

- **Vercel** = Hosts the web app (free)
- **Render** = Runs the backend API server (free)
- **MongoDB Atlas** = Stores all your data (free)

---

## Step 1: Push Code to GitHub

1. On the Emergent platform, click **"Save to GitHub"**
2. Connect your GitHub account
3. Create a **new repository** (e.g., `our-kitchen`)

---

## Step 2: Set Up MongoDB Atlas (Free Database)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) → Sign up (free)
2. Click **"Build a Database"** → Choose **M0 Free Tier**
3. Create a **Database User** (save the username & password!)
4. Under **Network Access** → **"Add IP Address"** → **"Allow Access from Anywhere"** (0.0.0.0/0)
5. Click **"Connect"** → **"Drivers"** → Copy the connection string:
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/meal_planner?retryWrites=true&w=majority
   ```
   Replace `USERNAME` and `PASSWORD` with your actual credentials.

---

## Step 3: Deploy Backend on Render (Free)

1. Go to [render.com](https://render.com) → Sign up with GitHub
2. Click **"New"** → **"Web Service"**
3. Connect your `our-kitchen` GitHub repo
4. Configure:
   - **Name**: `our-kitchen-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
5. Add **Environment Variables**:

| Variable | Value |
|----------|-------|
| `MONGO_URL` | Your MongoDB Atlas connection string from Step 2 |
| `DB_NAME` | `meal_planner` |
| `FIREBASE_PROJECT_ID` | `meal-planner-8cff4` |

6. Click **"Create Web Service"**
7. Wait for deploy (2-3 min). Copy your Render URL:
   ```
   https://our-kitchen-api.onrender.com
   ```
8. **Test it**: Open `https://our-kitchen-api.onrender.com/api/health` in your browser. You should see:
   ```json
   {"status": "healthy", "timestamp": "..."}
   ```

---

## Step 4: Deploy Frontend on Vercel (Free)

1. Go to [vercel.com](https://vercel.com) → Sign in with GitHub
2. Click **"Add New Project"** → Import your `our-kitchen` repo
3. Add **Environment Variables**:

| Variable | Value |
|----------|-------|
| `EXPO_PUBLIC_BACKEND_URL` | Your Render URL (e.g., `https://our-kitchen-api.onrender.com`) |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | `AIzaSyDRGiv0IM1buTzqE_6mwmwzdl3OVbkMObE` |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | `meal-planner-8cff4.firebaseapp.com` |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | `meal-planner-8cff4` |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | `meal-planner-8cff4.firebasestorage.app` |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `92385648492` |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | `1:92385648492:web:35fb6bfaeb304991051d49` |

4. Click **Deploy**!

---

## Step 5: Enable Firebase Auth

1. Go to [Firebase Console](https://console.firebase.google.com) → Your project
2. **Authentication** → **Sign-in method** → Enable **Email/Password**
3. Under **Settings** → **Authorized domains**, add:
   - Your Vercel domain (e.g., `our-kitchen.vercel.app`)

---

## That's it! 🎉

Your app is live! Open your Vercel URL on both phones. Log in with the same email & password to share recipes and meal plans.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Authentication failed" | Enable Email/Password in Firebase Console, add Vercel domain to authorized domains |
| "Failed to load recipes" | Check Render is running: visit `your-render-url/api/health` |
| "Network error" | Verify `EXPO_PUBLIC_BACKEND_URL` in Vercel matches your Render URL exactly |
| Render is slow on first request | Free tier sleeps after 15 min inactivity. First request takes ~30 sec to wake up |

### Render Free Tier Note
Render's free tier spins down after 15 minutes of no activity. The first request after sleep takes ~30 seconds. For always-on, upgrade to Render's $7/month plan.

---

## Project Structure

```
our-kitchen/
├── frontend/             ← Deployed to Vercel
│   ├── app/              ← Expo Router screens
│   ├── src/              ← Firebase config, API service
│   └── package.json
├── backend/              ← Deployed to Render
│   ├── server.py         ← FastAPI backend
│   └── requirements.txt
├── vercel.json           ← Vercel config (frontend only)
├── render.yaml           ← Render config (backend only)
└── DEPLOYMENT.md         ← This file
```
