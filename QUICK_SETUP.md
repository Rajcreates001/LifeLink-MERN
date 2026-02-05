# Quick Setup Guide - Complete These Steps

## 🔴 CRITICAL: You Must Do This

### Step 1: Get Your Backend Vercel URL
1. Go to your **backend project** on Vercel
2. Find the **Production** deployment
3. Copy the URL (e.g., `https://lifelink-backend-xyz.vercel.app`)

### Step 2: Update Server Environment Variables on Vercel
1. Vercel Dashboard → Backend Project → Settings → Environment Variables
2. Add/Update these:
   ```
   FRONTEND_URL = https://your-frontend-url.vercel.app
   NODE_ENV = production
   MONGO_URI = mongodb+srv://Maha_251:Maha_251@lifelinkcluster.unqq4gt.mongodb.net/?appName=LifeLinkCluster
   JWT_SECRET = lifelink_secret_key_123
   PORT = (can leave empty, Vercel assigns automatically)
   ```

### Step 3: Update Client Environment File
**File:** `/client/.env`

Replace:
```dotenv
VITE_API_URL=https://your-vercel-backend-url.vercel.app
```

With your actual backend URL from Step 1.

### Step 4: Get Your Frontend Vercel URL
1. Deploy frontend to Vercel
2. Copy the URL (e.g., `https://lifelink-frontend-xyz.vercel.app`)
3. Go back to Step 2 and update `FRONTEND_URL` with this

### Step 5: Test the Connection
1. Open your app at the frontend URL
2. Try to login/signup
3. Open **DevTools → Network tab**
4. Look at the login API call:
   - **URL** should point to your backend
   - **Response** should be JSON (starts with `{`), not HTML (starts with `<`)

## ✅ What Was Fixed

| Issue | Status | Location |
|-------|--------|----------|
| Template string syntax (`'${...}'` → `` `${...}` ``) | ✅ Fixed | 18 files |
| Wrong API URL (localhost → production URL) | ✅ Fixed | `client/.env` |
| Missing CORS configuration | ✅ Fixed | `server/server.js` |
| Missing environment variables | ✅ Fixed | `server/.env` |
| JSON parsing error handling | ✅ Fixed | `server/server.js` |

## 🧪 Testing Checklist

- [ ] Backend deployed and URL copied
- [ ] Server environment variables updated on Vercel
- [ ] `client/.env` updated with backend URL
- [ ] Frontend deployed to Vercel
- [ ] Frontend URL added to server environment variables
- [ ] Tried login/signup
- [ ] Network tab shows JSON responses (not HTML)
- [ ] No CORS errors in browser console

## 📝 Remember

- **Never** commit `.env` files with actual credentials
- Use Vercel's Environment Variables dashboard for production secrets
- Test locally first with `npm run dev` before deploying
- Check Vercel logs if something goes wrong

---
All fixes applied! Just need to update the URLs above. 🚀
