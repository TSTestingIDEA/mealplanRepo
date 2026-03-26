# 🍽️ Our Kitchen - Deployment Guide

## Step-by-Step: Deploy to Vercel + GitHub

### Prerequisites
- A GitHub account (free)
- A Vercel account (free at vercel.com — sign up with GitHub)
- A MongoDB Atlas account (free at mongodb.com/atlas)

---

## Step 1: Export Code to GitHub

1. On the Emergent platform, click **"Save to GitHub"** button
2. Connect your GitHub account when prompted
3. Choose to create a **new repository** (e.g., `our-kitchen`)
4. All code will be pushed automatically

---

## Step 2: Set Up MongoDB Atlas (Free Database)

Since Vercel doesn't have a built-in database, you need a cloud MongoDB:

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) → Sign up (free)
2. Click **"Build a Database"** → Choose **M0 Free Tier**
3. Select a region close to you
4. Create a **Database User** (remember the username & password)
5. Under **Network Access** → Click **"Add IP Address"** → Click **"Allow Access from Anywhere"** (0.0.0.0/0)
6. Click **"Connect"** → **"Drivers"** → Copy the connection string
   - It looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/meal_planner?retryWrites=true&w=majority`
   - Replace `<password>` with your actual database password

---

## Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → Log in with GitHub
2. Click **"Add New Project"** → Import your `our-kitchen` repo
3. **Important**: Set the **Root Directory** to `.` (root, don't change)
4. Before clicking Deploy, add **Environment Variables**:

| Variable | Value |
|----------|-------|
| `MONGO_URL` | Your MongoDB Atlas connection string from Step 2 |
| `DB_NAME` | `meal_planner` |
| `FIREBASE_PROJECT_ID` | `meal-planner-8cff4` |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | `AIzaSyDRGiv0IM1buTzqE_6mwmwzdl3OVbkMObE` |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | `meal-planner-8cff4.firebaseapp.com` |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | `meal-planner-8cff4` |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | `meal-planner-8cff4.firebasestorage.app` |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `92385648492` |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | `1:92385648492:web:35fb6bfaeb304991051d49` |
| `EXPO_PUBLIC_BACKEND_URL` | _(leave empty for now, update after deploy)_ |

5. Click **Deploy**!

---

## Step 4: Update Backend URL

After Vercel deploys, you'll get a URL like `https://our-kitchen.vercel.app`

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Set `EXPO_PUBLIC_BACKEND_URL` = `https://our-kitchen.vercel.app`
3. Click **Redeploy** (Deployments tab → click ⋮ on latest → Redeploy)

---

## Step 5: Enable Firebase Auth

For the app to work, you need to enable authentication in Firebase:

1. Go to [Firebase Console](https://console.firebase.google.com) → Your project (`meal-planner-8cff4`)
2. Go to **Authentication** → **Sign-in method**
3. Enable **Email/Password** (for demo login)
4. Enable **Google** (for Google Sign-In)
5. Under **Settings** → **Authorized domains**, add your Vercel domain:
   - `our-kitchen.vercel.app` (or whatever your domain is)

---

## That's it! 🎉

Your app is now live at `https://our-kitchen.vercel.app`

### Sharing with your wife:
- Both of you open the same URL in your phone's browser
- Log in with the **same Google account** or **same email/password**
- All recipes, meal plans, and grocery lists will be synced!

### Custom Domain (Optional):
1. In Vercel → **Settings** → **Domains**
2. Add your custom domain (e.g., `ourkitchen.com`)
3. Follow the DNS instructions Vercel provides

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Auth failed" after deploy | Make sure Firebase authorized domains includes your Vercel URL |
| "Network error" | Check EXPO_PUBLIC_BACKEND_URL is set correctly in Vercel env vars |
| "Database error" | Verify MONGO_URL in Vercel env vars, check MongoDB Atlas Network Access allows 0.0.0.0/0 |
| Google Sign-In not working | Enable Google provider in Firebase Auth, add Vercel domain to authorized domains |

---

## Project Structure

```
our-kitchen/
├── api/
│   └── index.py          ← Backend API (Vercel serverless function)
├── frontend/
│   ├── app/              ← Expo Router screens
│   ├── src/              ← Firebase config, API service, auth context
│   ├── app.json          ← Expo configuration
│   └── package.json      ← Frontend dependencies
├── backend/
│   └── server.py         ← Backend (used in development)
├── vercel.json           ← Vercel deployment configuration
├── requirements.txt      ← Python dependencies for Vercel
└── DEPLOYMENT.md         ← This file
```
