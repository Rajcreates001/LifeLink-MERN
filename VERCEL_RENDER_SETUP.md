# Fix "Failed to fetch" on Login/Signup (Vercel + Render + MongoDB Atlas)

## Cause

- **Frontend (Vercel):** If `VITE_API_URL` is not set, the app requests `undefined/api/auth/login` → network error / "Failed to fetch".
- **Backend (Render):** If `FRONTEND_URL` is wrong or missing, the browser blocks the response (CORS).

## 1. Vercel (frontend)

1. Open your **Vercel** project → **Settings** → **Environment Variables**.
2. Add (or update):
   - **Name:** `VITE_API_URL`
   - **Value:** Your **Render** backend URL, e.g. `https://lifelink-api.onrender.com`  
     - No trailing slash.
     - Use **https**.
3. **Redeploy** the frontend (Deployments → ⋮ → Redeploy) so the new variable is used in the build.

## 2. Render (backend)

1. Open your **Render** service → **Environment**.
2. Set:
   - **FRONTEND_URL** = Your **Vercel** app URL, e.g. `https://lifelink.vercel.app`  
     - No trailing slash.  
     - For multiple origins (e.g. preview URLs), use comma-separated:  
       `https://lifelink.vercel.app,https://lifelink-git-xxx.vercel.app`
   - **MONGO_URI** = Your MongoDB Atlas connection string.
   - **JWT_SECRET** = A long random string (e.g. from `openssl rand -hex 32`).
   - **NODE_ENV** = `production` (optional; Render often sets it).
3. Save; Render will redeploy.

## 3. MongoDB Atlas

- Use a connection string like:  
  `mongodb+srv://USER:PASSWORD@cluster.xxxxx.mongodb.net/DATABASE?retryWrites=true&w=majority`
- In Atlas: **Network Access** → allow `0.0.0.0/0` (or restrict to Render IPs if you prefer).

## Quick checklist

| Where   | Variable       | Example value                          |
|--------|----------------|----------------------------------------|
| Vercel | `VITE_API_URL` | `https://lifelink-api.onrender.com`   |
| Render | `FRONTEND_URL` | `https://lifelink.vercel.app`         |
| Render | `MONGO_URI`    | `mongodb+srv://...`                    |
| Render | `JWT_SECRET`   | (random secret string)                |

After updating env vars, redeploy both Vercel and Render, then try login/signup again.
