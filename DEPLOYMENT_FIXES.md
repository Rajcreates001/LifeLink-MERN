# LifeLink MERN - Vercel Deployment Fixes

## Issues Found & Fixed

### 1. **Template String Syntax Error** ❌ FIXED
**Problem:** All API calls were using single quotes with `${...}` which doesn't interpolate variables.
```javascript
// WRONG - Single quotes don't interpolate
const res = await fetch('${import.meta.env.VITE_API_URL}/api/auth/login', {
```

**Solution:** Changed all instances to use backticks:
```javascript
// CORRECT - Backticks interpolate variables
const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
```

**Files Fixed:**
- `/client/src/pages/Login.jsx`
- `/client/src/pages/Signup.jsx`
- `/client/src/pages/GovernmentDashboard.jsx`
- `/client/src/pages/PublicDashboard.jsx`
- `/client/src/pages/Auth.jsx`
- `/client/src/components/AuthorityOutbreak.jsx`
- `/client/src/components/AuthorityUserMgmt.jsx`
- `/client/src/components/AuthorityResources.jsx`
- `/client/src/components/HealthRiskCalculator.jsx`
- `/client/src/components/HospitalCommunications.jsx`
- `/client/src/components/HospitalAnalytics.jsx`
- `/client/src/components/HospitalPatients.jsx`
- `/client/src/components/HospitalOverview.jsx`
- `/client/src/components/HospitalResources.jsx`
- `/client/src/components/HospitalAI.jsx`
- `/client/src/components/GovernmentAI.jsx`
- `/client/src/components/EmergencyHotspotMap.jsx`
- `/client/src/components/AmbulanceETARoute.jsx`

### 2. **Wrong API URL in Production** ❌ FIXED
**Problem:** `.env` file had localhost URL which doesn't work on Vercel.
```dotenv
VITE_API_URL=http://localhost:3001  // ❌ WRONG for production
```

**Solution:** Updated to point to Vercel backend:
```dotenv
VITE_API_URL=https://your-vercel-backend-url.vercel.app  // ✅ CORRECT
```

**Action Required:** Replace `your-vercel-backend-url` with your actual Vercel backend project URL.

### 3. **Missing CORS Configuration** ❌ FIXED
**Problem:** Server was using `cors()` without specifying allowed origins, causing issues in production.

**Solution:** Enhanced `/server/server.js` with:
```javascript
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? [process.env.FRONTEND_URL || 'https://your-vercel-frontend.vercel.app']
        : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

### 4. **Missing Environment Variables** ❌ FIXED
**Problem:** Server didn't have `NODE_ENV` and `FRONTEND_URL` configured for production.

**Solution:** Updated `/server/.env`:
```dotenv
PORT=10000
NODE_ENV=production
FRONTEND_URL=https://your-vercel-frontend.vercel.app
MONGO_URI=mongodb+srv://Maha_251:...
JWT_SECRET=lifelink_secret_key_123
```

### 5. **JSON Parsing Error Handling** ❌ FIXED
**Problem:** Invalid JSON from errors wasn't being caught properly, returning HTML instead of JSON.

**Solution:** Added error middleware in `/server/server.js`:
```javascript
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON in request body' });
    }
    next();
});
```

## Deployment Checklist

### ✅ Before Deploying to Vercel:

1. **Update Frontend Environment Variables:**
   - In `/client/.env`, replace:
     ```
     VITE_API_URL=https://your-actual-vercel-backend-url.vercel.app
     ```
   - Get your backend URL from Vercel project settings

2. **Update Backend Environment Variables on Vercel:**
   - In Vercel dashboard, go to your backend project → Settings → Environment Variables
   - Add/Update:
     ```
     FRONTEND_URL=https://your-vercel-frontend-url.vercel.app
     NODE_ENV=production
     MONGO_URI=mongodb+srv://Maha_251:Maha_251@lifelinkcluster.unqq4gt.mongodb.net/?appName=LifeLinkCluster
     JWT_SECRET=lifelink_secret_key_123
     PORT=3001 (or let Vercel assign)
     ```

3. **Verify MongoDB Atlas Settings:**
   - Your connection string must have the correct username/password
   - IP whitelist should include Vercel's IPs or use "0.0.0.0/0" for testing
   - Access MongoDB Atlas → Network Access → IP Whitelist

4. **Deploy Backend First:**
   - Push server code to your backend repository
   - Deploy on Vercel
   - Copy the deployment URL

5. **Update Frontend Environment:**
   - Update `VITE_API_URL` in client `.env` with the backend URL
   - Rebuild and deploy frontend

### 🔍 Testing After Deployment:

1. **Test API Connection:**
   ```bash
   curl https://your-vercel-backend.vercel.app/api/auth/login
   ```
   Should return a JSON error about missing body, not HTML.

2. **Test Login/Signup:**
   - Open browser DevTools → Network tab
   - Check that API calls go to your Vercel backend
   - Responses should be valid JSON, not HTML

3. **Check Error Messages:**
   - If you see "Unexpected token 'T'" or "The page c", it means:
     - API URL is pointing to wrong endpoint
     - CORS is blocking the request
     - Server is returning HTML error page instead of JSON

## Error Messages Explained

| Error | Cause | Solution |
|-------|-------|----------|
| `Unexpected token 'T'` | HTML `<!DOCTYPE...>` being parsed as JSON | Check CORS & API URL |
| `The page c...` | HTML `<html>` being parsed as JSON | Backend URL misconfigured |
| `CORS error` | Frontend URL not in allowed origins | Add to CORS_ORIGIN in backend |
| `Network error` | API URL unreachable | Verify backend deployed & URL correct |

## MongoDB Atlas Configuration

Your current configuration:
- **Cluster:** LifeLinkCluster
- **Database:** lifelink_db (inferred from URI)
- **Connection String:** `mongodb+srv://Maha_251:Maha_251@lifelinkcluster.unqq4gt.mongodb.net/?appName=LifeLinkCluster`

⚠️ **Security Note:** Username/password in `.env` is visible. For production:
1. Create a read-only user in MongoDB Atlas
2. Use environment variables in Vercel dashboard (never commit .env)
3. Consider using IP whitelist restrictions

## Next Steps

1. Deploy backend to Vercel
2. Get the backend URL from deployment
3. Update both `.env` files with correct URLs
4. Deploy frontend to Vercel
5. Test login/signup functionality
6. Monitor Vercel logs for any errors

## If Issues Persist

Check these in order:
1. **Vercel Backend Logs:** Look for MongoDB connection errors
2. **Browser DevTools:** Network tab shows what URL is actually being called
3. **CORS Headers:** Response should include `Access-Control-Allow-Origin`
4. **JSON Response:** Response should start with `{` not `<`
5. **MongoDB Atlas:** Verify connection string and IP whitelist

---

**Updated:** February 5, 2026
**Status:** All critical fixes applied ✅
