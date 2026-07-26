import "./tracing.js"; // Must be imported before everything else for auto-instrumentation
import dotenv from "dotenv";
import express from "express";
import "express-async-errors";
import cors from "cors";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import pinoHttp from "pino-http";
import logger from "./utils/logger.js";
import productRoutes from "./routes/productRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import llmRoutes from "./routes/llmRoutes.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { AppError } from "./utils/errors.js";

// Load environment variables from .env or .env.local
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(",") 
  : [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
      "https://nutri-scanner-one.vercel.app"
    ];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.options("*", cors())

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging Middleware
app.use(pinoHttp({
  logger,
  genReqId: function (req, res) {
    const id = req.get('X-Request-Id') || uuidv4();
    res.setHeader('X-Request-Id', id);
    return id;
  },
  customLogLevel: function (req, res, err) {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn';
    } else if (res.statusCode >= 500 || err) {
      return 'error';
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
      return 'silent';
    }
    return 'info';
  },
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      query: req.query,
      params: req.params,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  }
}));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
});

// Routes
app.use("/api/", apiLimiter);
app.use("/api/upload", uploadRoutes);
app.use("/api/product", productRoutes);
app.use("/api/analyze-food", llmRoutes);

// Health check endpoints
app.get("/healthz", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

app.get("/ready", (req, res) => {
  res.status(200).json({ status: "ok", memoryUsage: process.memoryUsage() });
});

app.get("/", (req, res) => res.send("🌍 EcoScan API Running"));

// Error handling middleware
app.use((error, req, res, next) => {
  req.log.error({ err: error }, "Server Error");

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

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

if (process.env.NODE_ENV !== 'test') {
  logger.info("Server file loaded. Starting listener...");
  app.listen(PORT, () => {
    logger.info(`EcoScan API running on http://localhost:${PORT}`);
  });
}

export default app;