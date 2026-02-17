# 🏃 Quick Start Guide

Complete setup in 5 minutes.

---

## Local Setup (First Time)

### 1. Install Node.js & Python (if needed)
```bash
# Check versions
node --version    # Should be 16+
python3 --version # Should be 3.8+
```

### 2. Clone & Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend  
cd ../frontend
npm install

# Python (run from project root)
pip install -r requirements.txt
```

### 3. Configure Environment

**Backend** (optional - uses defaults):
```bash
# backend/.env
PORT=3001
NODE_ENV=development
```

**Frontend**:
```bash
# frontend/.env.local
VITE_API_BASE_URL=http://localhost:3001
```

### 4. Run Locally

**Terminal 1 - Backend**:
```bash
cd backend
npm start
# Output: ✅ EcoScan API running on port 3001
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
# Output: Local: http://localhost:5173
```

### 5. Test
- Open http://localhost:5173
- Scan a barcode
- See results with ML predictions

---

## Production Deployment

### Deploy Backend (Render)

1. Push to GitHub
2. Go to render.com
3. Create Web Service
4. Connect GitHub repo
5. Settings:
   - Build: `npm install`
   - Start: `npm start`
   - Environment: `PORT=3000`
6. Deploy
7. Copy URL (e.g., `https://app.onrender.com`)

### Deploy Frontend (Vercel)

1. Go to vercel.com
2. Import project
3. Settings:
   - Root: `frontend`
   - Environment: `VITE_API_BASE_URL=https://app.onrender.com`
4. Deploy

### Test Production

```bash
curl https://app.onrender.com/api/product/8712100762395
```

Should return JSON with `ml_health_label`.

---

## Quick Commands

```bash
# Check Python setup
python3 -c "import joblib, sklearn; print('✅ All good')"

# Test ML script directly
python3 ml/predict_health.py << 'EOF'
{"sugar":10,"fat":5,"salt":0.5,"fiber":3,"protein":10,"energy":80,"additives":1,"nova":2,"plastic":1,"palm_oil":0}
EOF

# Restart backend
cd backend && npm start

# Restart frontend
cd frontend && npm run dev

# Build frontend for production
cd frontend && npm run build
```

---

## Troubleshooting

### Backend won't start
```bash
# Check port is free
lsof -i :3001

# Kill process on port
kill -9 $(lsof -t -i:3001)
```

### ML not working
```bash
# Check Python
python3 --version
python3 -c "import joblib"

# Check model file
ls ml/models/health_model.pkl

# Test script
python3 ml/predict_health.py
```

### Frontend can't reach backend
```bash
# Check .env.local
cat frontend/.env.local

# Should be:
VITE_API_BASE_URL=http://localhost:3001

# NOT /api or relative paths!
```

---

## File Structure

```
EcoScan-React/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── .env.local          ← Create this
│   └── .env.example
├── ml/
│   ├── predict_health.py
│   └── models/health_model.pkl
├── requirements.txt
└── DEPLOYMENT.md           ← Full guide
```

---

## Environment Variables

**Frontend** (in `frontend/.env.local`):
```
VITE_API_BASE_URL=http://localhost:3001   # Local
# Or production:
VITE_API_BASE_URL=https://app.onrender.com
```

**Backend** (in `backend/.env`):
```
PORT=3001
NODE_ENV=development
```

---

## Next Steps

1. ✅ Follow Local Setup above
2. ✅ Run all 3 terminals (backend, frontend, optionally Python test)
3. ✅ Test at http://localhost:5173
4. ✅ Follow Production Deployment for Render + Vercel
5. ✅ Share link: https://your-app.vercel.app

---

## Need Help?

- See `DEPLOYMENT.md` for detailed guide
- See `FIXES_SUMMARY.md` for what was fixed
- Check server logs: `backend/` or `cd backend && npm start`
- Check frontend console: Browse DevTools → Console

---

**Last Updated**: Feb 17, 2026
