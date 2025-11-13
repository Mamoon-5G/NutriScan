import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";
import productRoutes from "./routes/productRoutes.js";
import path from "path";
import fs from "fs";
import uploadRoutes from "./routes/uploadRoutes.js";
// Inside server.js (right after imports)
import { getEnvironmentalImpact } from "./utils/environmentalImpact.js";

const app = express();

// CORS configuration
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:4173",
    "https://nutri-scanner-one.vercel.app",
    "https://nutriscan-zii9.onrender.com"
  ],
  credentials: true
}));

// Body parser middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Ensure upload folder exists
const uploadsDir = "uploads";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("📁 Created uploads directory");
}

// Serve static files from uploads directory
app.use("/uploads", express.static(uploadsDir));

// Routes
app.use("/api/upload", uploadRoutes);
app.use("/api/product", productRoutes);

// Health check endpoint
app.get("/", (req, res) => res.send("🌍 Product Analysis API Running"));

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
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📁 Uploads directory: ${path.resolve(uploadsDir)}`);
});
