# Production Deployment Guide - EcoScan

This guide helps fix ML integration and deploy the full-stack app to the cloud (Render + Vercel).

## 🎯 What Was Fixed

### ✅ Backend Path Issues
- Fixed `mlPredictor.js` to use absolute paths via `import.meta.url` and `fileURLToPath`
- Updated `productController.js` to use `path.resolve(__dirname, ...)` for CSV storage
- Fixed `server.js` uploads directory to use absolute path
- All relative paths now work on Render

### ✅ Python ML Integration
- Improved `predict_health.py` with comprehensive error handling
- Model loads using absolute path `os.path.dirname(__file__)`
- Graceful fallback: returns `"unavailable"` if ML fails
- Uses `python3` executable for compatibility
- Added 10-second timeout for ML predictions
- Handles missing model files gracefully

### ✅ Error Handling
- ML prediction is now **optional** (won't crash API if it fails)
- Backend always returns product data even if ML fails
- Frontend shows "Temporarily unavailable" if ML is down
- No HTML/stack traces sent to frontend

### ✅ Frontend Setup
- Created `.env.example` with configuration template
- Uses `import.meta.env.VITE_API_BASE_URL` for API calls
- MLAssessmentCard handles unavailable predictions
- Graceful error handling with user-friendly messages

---

## 📋 Prerequisites

### Local Development
- Node.js 16+ & npm
- Python 3.8+
- Git

### Production (Render)
- Python buildpack enabled
- `requirements.txt` detected automatically
- Environment variables configured

---

## 🚀 Local Setup

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

**Python (ML):**
```bash
pip install -r requirements.txt
```

### 2. Configure Environment

**Backend `.env`** (create in `/backend`):
```bash
PORT=3001
NODE_ENV=development
```

**Frontend `.env.local`** (create in `/frontend`):
```bash
VITE_API_BASE_URL=http://localhost:3001
```

### 3. Run Locally

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```
Expected output: `✅ EcoScan API running on port 3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Expected output: `http://localhost:5173`

**Test**: Open browser → http://localhost:5173

---

## ☁️ Deploy to Render (Backend)

### 1. Create Render Service

- Go to [render.com](https://render.com)
- Connect GitHub repository
- Create **New → Web Service**
- Select your repository and `backend` directory

### 2. Configure Build & Start

**Build Command:**
```bash
npm install
```

**Start Command:**
```bash
npm start
```

### 3. Environment Variables

In Render dashboard, add:
```
PORT=3000
NODE_ENV=production
```

### 4. Python Support

Render uses buildpacks. Your `requirements.txt` must be in root or `/backend`:

```bash
# File: /backend/requirements.txt
joblib==1.4.2
numpy==1.24.3
scikit-learn==1.3.0
```

⚠️ **Important**: Python must be installed on Render's buildpack. Check:
- Render → Service Settings → Build & Deploy
- Ensure Python buildpack is enabled

### 5. Verify Deployment

Wait for deploy to complete, then test:
```bash
curl https://your-render-url.onrender.com/
```
Expected: `🌍 EcoScan API Running`

---

## 📱 Deploy to Vercel (Frontend)

### 1. Create Vercel Project

- Go to [vercel.com](https://vercel.com)
- Create **New Project** → Import Git repo
- Select `/frontend` as root directory

### 2. Environment Variables

In Vercel dashboard, add:
```
VITE_API_BASE_URL=https://your-render-backend-url.onrender.com
```

### 3. Build Settings

- **Framework**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4. Deploy

- Click **Deploy**
- Wait for build to complete
- Your app is live at `https://your-project.vercel.app`

---

## 🔍 Testing ML Integration

### Local Test

```bash
curl -O http://localhost:3001/api/product/8712100762395
# Should return:
# {
#   "product_name": "...",
#   "ml_health_label": 0,  // 0=Healthy, 1=Moderate, 2=High
#   "environmental_impact": "..."
# }
```

### Production Test

```bash
curl https://your-backend.onrender.com/api/product/8712100762395
```

### Handle ML Failures

If `ml_health_label` is `"unavailable"`:
- Check Render logs for Python errors
- Verify model file exists: `/ml/models/health_model.pkl`
- Frontend will show: "ML analysis temporarily unavailable"

---

## 🐛 Troubleshooting

### 500 Error on `/api/product/:barcode`

**Logs:**
```bash
# Render dashboard → Logs
# Look for: "ML prediction failed" or "Error fetching product"
```

**Fix:**
1. Check Python path: `echo $PYTHONPATH` on Render
2. Verify model exists in `/ml/models/health_model.pkl`
3. Check `requirements.txt` installed: `pip freeze`

### "Unexpected token <" JSON Error

- Backend returning HTML instead of JSON
- Check server logs, fix error first
- Never send stack traces to frontend

### Frontend Can't Reach Backend

**Frontend `.env` issue:**
```bash
# Wrong:
VITE_API_BASE_URL=/api  # Relative path

# Correct:
VITE_API_BASE_URL=https://your-backend.onrender.com
```

### Model Loading Fails

```bash
# Check model path in Python:
python3 -c "import os; print(os.path.dirname('/path/to/ml/predict_health.py'))"
```

Expected: `/path/to/ml/models/health_model.pkl` exists

---

## 📦 Production Checklist

- [ ] Backend URL in Vercel `.env`
- [ ] Python `requirements.txt` at `/backend/requirements.txt`
- [ ] Model file at `/ml/models/health_model.pkl`
- [ ] `python3` available on Render
- [ ] CSV data directory writable on Render
- [ ] CORS origins include Vercel URL
- [ ] All relative paths use `path.resolve()`
- [ ] ML prediction has timeout handling
- [ ] Error responses are JSON only

---

## 📚 File Structure

```
EcoScan-React/
├── backend/
│   ├── controllers/
│   │   ├── productController.js      # ✅ Fixed paths
│   │   └── uploadController.js
│   ├── utils/
│   │   └── mlPredictor.js            # ✅ Fixed paths + timeout
│   ├── server.js                      # ✅ Fixed upload path
│   ├── package.json
│   └── .env.example                   # ✅ Created
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── MLAssessmentCard.tsx  # ✅ Handles unavailable
│   │   └── pages/
│   │       └── Index.tsx
│   ├── .env.local
│   └── .env.example                   # ✅ Created
├── ml/
│   ├── predict_health.py              # ✅ Improved error handling
│   ├── models/
│   │   └── health_model.pkl
│   └── train_model.py
├── requirements.txt                    # ✅ Created with Python deps
└── DEPLOYMENT.md                       # ✅ This file
```

---

## 🚨 Critical Notes

1. **Never commit `.env` files** - Use `.env.example` as template
2. **Model file must be tracked in Git** - `.pkl` files should not be in `.gitignore`
3. **Python 3 required** - Render needs Python buildpack
4. **Absolute paths everywhere** - No relative paths in production
5. **ML graceful fallback** - Always return product data, even if ML fails
6. **Timeouts required** - ML predictions must have timeout to prevent hanging

---

## 💡 Quick Commands

```bash
# Test backend health
curl http://localhost:3001/

# Test product endpoint
curl http://localhost:3001/api/product/8712100762395

# Check Python setup
python3 --version
pip list | grep joblib

# Test ML script directly
python3 /backend/ml/predict_health.py < '{"sugar":10,"fat":5,"salt":0.5,...}'
```

---

Generated: Feb 17, 2026
Last Updated: Production ML Integration Fix
