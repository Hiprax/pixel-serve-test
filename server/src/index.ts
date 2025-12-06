import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerServe } from "pixel-serve-server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for client
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Static files directory
const IMAGES_DIR = path.join(__dirname, "../public/images");
const PRIVATE_DIR = path.join(__dirname, "../public/private");

// Create pixel serve middleware
const serveImage = registerServe({
  baseDir: IMAGES_DIR,

  // Handle user IDs
  idHandler: (id: string) => id,

  // Resolve private folders
  getUserFolder: async (_req, userId) => {
    // In a real app, you'd verify authentication here
    if (userId) {
      return path.join(PRIVATE_DIR, userId);
    }
    return IMAGES_DIR;
  },

  // Your website URL (for treating internal URLs as local)
  websiteURL: "localhost:3001",

  // API prefix to strip from internal URLs
  apiRegex: /^\/api\//,

  // Allowed external image sources
  allowedNetworkList: [
    "images.unsplash.com",
    "picsum.photos",
    "placekitten.com",
    "via.placeholder.com",
  ],

  // Cache settings
  cacheControl: "public, max-age=3600",
  etag: true,

  // Image bounds
  minWidth: 50,
  maxWidth: 2000,
  minHeight: 50,
  maxHeight: 2000,
  defaultQuality: 80,

  // Network settings
  requestTimeoutMs: 10000,
  maxDownloadBytes: 10_000_000,
});

// Mount the image serving endpoint
app.get("/api/pixel/serve", serveImage);

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API info endpoint
app.get("/api/info", (_req, res) => {
  res.json({
    name: "Pixel Serve Test Server",
    version: "1.0.0",
    endpoints: {
      images: "/api/pixel/serve",
      health: "/api/health",
    },
    allowedExternalHosts: [
      "images.unsplash.com",
      "picsum.photos",
      "placekitten.com",
      "via.placeholder.com",
    ],
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Pixel Serve Test Server running on http://localhost:${PORT}`);
  console.log(`📸 Image endpoint: http://localhost:${PORT}/api/pixel/serve`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
});
