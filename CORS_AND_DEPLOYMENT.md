# NutriScan - CORS & Deployment Configuration

## CORS Fix Applied

The CORS (Cross-Origin Resource Sharing) issue has been resolved by updating the backend server configuration to accept requests from your frontend deployment.

### Backend CORS Configuration

**File:** `backend/server.js`

The backend now allows requests from the following origins:

```javascript
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:4173",
    "https://nutri-scanner-one.vercel.app",  // Your Vercel frontend
    "https://nutriscan-zii9.onrender.com"     // Your Render backend
  ],
  credentials: true
}));
```

### Why This Was Needed

The CORS policy error occurred because:
- **Frontend Origin:** `https://nutri-scanner-one.vercel.app` (Vercel deployment)
- **Backend Origin:** `https://nutriscan-zii9.onrender.com` (Render deployment)
- **Issue:** Browsers block cross-origin requests unless the server explicitly allows them via CORS headers

### Frontend Environment Configuration

**File:** `frontend/.env`

```
VITE_API_URL=https://nutriscan-zii9.onrender.com
```

**File:** `frontend/.env.local` (local development only)

```
VITE_API_URL=http://localhost:5000
```

The frontend uses `import.meta.env.VITE_API_URL` to dynamically set the backend URL, ensuring it works seamlessly across development and production environments.

## Complete Rebranding to NutriScan

All references have been updated from EcoScan to NutriScan:

- ✅ `frontend/src/pages/Index.tsx` - Main title and heading
- ✅ `frontend/src/lib/api.ts` - Comment and documentation
- ✅ `frontend/index.html` - Page title, meta tags, and social media metadata
- ✅ `backend/package.json` - Package name and description
- ✅ `frontend/ENV_SETUP.md` - Documentation

## Deployment Steps

### 1. Deploy Backend (Render)

Push your backend changes to GitHub, and they'll automatically deploy to Render:

```bash
git add backend/
git commit -m "Fix CORS configuration for Vercel frontend"
git push origin main
```

### 2. Deploy Frontend (Vercel)

Push your frontend changes to GitHub, and they'll automatically deploy to Vercel:

```bash
git add frontend/
git commit -m "Update branding to NutriScan and fix CORS environment variables"
git push origin main
```

### 3. Test the Connection

1. Visit `https://nutri-scanner-one.vercel.app`
2. Enter a barcode or upload a product image
3. If CORS is working correctly, you should see product data without any CORS errors

## Environment Variables Summary

### Backend (.env or system variables on Render)

- Should be set to allow CORS from the Vercel frontend
- No environment variables needed - CORS is hardcoded in `server.js`

### Frontend (.env)

| Variable | Value | Usage |
|----------|-------|-------|
| `VITE_API_URL` | `https://nutriscan-zii9.onrender.com` | Production backend URL |

### Frontend (.env.local - local development only)

| Variable | Value | Usage |
|----------|-------|-------|
| `VITE_API_URL` | `http://localhost:5000` | Local backend URL |

## Troubleshooting

If you still see CORS errors:

1. **Check backend is running** - Visit `https://nutriscan-zii9.onrender.com/` in your browser
2. **Verify .env file** - Make sure `VITE_API_URL` is set correctly without trailing slashes
3. **Check browser console** - Look for the exact error message
4. **Rebuild frontend** - Vite may need to reload environment variables:
   ```bash
   npm run dev  # Local
   # or rebuild on Vercel
   ```

## Testing Locally

To test locally with both development and production backends:

### Using Local Backend
```bash
# .env.local
VITE_API_URL=http://localhost:5000

npm run dev
# Visit http://localhost:5173
```

### Using Production Backend
```bash
# .env.local
VITE_API_URL=https://nutriscan-zii9.onrender.com

npm run dev
# Visit http://localhost:5173
```

The frontend will automatically adapt to the backend URL configured in `.env.local`.
