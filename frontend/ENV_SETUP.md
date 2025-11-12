# EcoScan Frontend - Environment Setup

## Environment Variables

The frontend uses Vite's environment variable system to connect to the backend API. All environment variables must be prefixed with `VITE_` to be accessible in the browser via `import.meta.env`.

### Files

- **`.env`** - Production configuration (committed to git)
  - Contains the Render deployed backend URL: `https://nutriscan-zii9.onrender.com`

- **`.env.local`** - Local development configuration (NOT committed to git, ignored by `.gitignore`)
  - Used when running locally with your backend on `http://localhost:5000`
  - This file is ignored by git and should be created locally for development

### Setup for Local Development

1. Create `.env.local` in the frontend directory (if it doesn't exist):
```
VITE_API_URL=http://localhost:5000
```

2. For production, the `.env` file uses:
```
VITE_API_URL=https://nutriscan-zii9.onrender.com
```

### Usage in Code

The environment variable is used throughout the frontend via `import.meta.env.VITE_API_URL`:

```typescript
const apiUrl = import.meta.env.VITE_API_URL || "";
const response = await fetch(`${apiUrl}/api/product/${barcode}`);
```

### How Vite Environment Variables Work

- During development (`npm run dev`), Vite loads `.env.local` first, then `.env`
- During production build (`npm run build`), `.env` is used
- Only variables prefixed with `VITE_` are exposed to the client-side code
- Environment variables are baked into the build and accessible via `import.meta.env`

### Switching Between Development and Production

- **Local Development**: `.env.local` will be loaded (points to localhost backend)
- **Production Build**: `.env` will be used (points to Render backend)
- **Manual Override**: You can temporarily modify `.env.local` for testing different backends

