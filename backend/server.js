import express from "express";
import cors from "cors";
import multer from "multer";
import productRoutes from "./routes/productRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS configuration
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "https://nutri-scanner-one.vercel.app"
  ],
  credentials: true
}));

app.options("*", cors())

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Run on Vercel?
const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';

// Ensure upload folder exists (use /tmp on Vercel, which is writable)
const uploadsDir = isVercel ? path.join("/tmp", "uploads") : path.resolve(__dirname, "uploads");

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log("📁 Created uploads directory:", uploadsDir);
  }
} catch (error) {
  console.error("⚠️ Failed to create uploads directory:", error.message);
}

// Serve static files from uploads directory
app.use("/uploads", express.static(uploadsDir));

// Routes
app.use("/api/upload", uploadRoutes);
app.use("/api/product", productRoutes);

// Health check endpoint
app.get("/", (req, res) => res.send("🌍 EcoScan API Running"));

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("❌ Server Error:", error);

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: error.message });
  }

  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`✅ EcoScan API running on http://localhost:${PORT}`);
  });
}

export default app;