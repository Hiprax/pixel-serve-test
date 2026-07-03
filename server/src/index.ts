import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerServe } from "pixel-serve-server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3001;
// Bind to loopback by default so the demo server is not exposed on the LAN.
// Operators who explicitly want to listen on every interface can opt in by
// setting `HOST=0.0.0.0` (or any interface address) before starting the
// process. Keeping the default narrow is a defense-in-depth measure that
// also matches how most local dev servers ship.
const HOST = process.env.HOST || "127.0.0.1";

// CORS origin resolution.
//
// We accept the origin (or origins) via the `CORS_ORIGIN` env var so deploys
// don't have to fork the source to swap hosts. Falls back to the Vite dev
// origin when nothing is set so the local demo "just works".
//
// Multiple origins can be supplied as a comma-separated list, e.g.
// `CORS_ORIGIN="http://localhost:5173,https://demo.example.com"`. When more
// than one entry is parsed we hand the cors() middleware an array so it
// reflects whichever origin the request actually came from.
const DEFAULT_CORS_ORIGIN = "http://localhost:5173";
const corsOriginList = (process.env.CORS_ORIGIN ?? DEFAULT_CORS_ORIGIN)
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);
const corsOrigin: string | string[] =
  corsOriginList.length > 1 ? corsOriginList : (corsOriginList[0] ?? DEFAULT_CORS_ORIGIN);

// Security headers via Helmet.
//
// Adds a sensible baseline (X-Content-Type-Options, X-Frame-Options,
// Strict-Transport-Security when over HTTPS, Referrer-Policy, etc.) without
// any per-route configuration. CSP is intentionally disabled because the
// demo React client renders with inline styles, which a strict default CSP
// would block. Production deployments should re-enable CSP with an
// allowlist tailored to their bundle.
app.use(helmet({ contentSecurityPolicy: false }));

// Rate limiting.
//
// Image processing is CPU-heavy (Sharp decodes, resizes, and re-encodes on
// every miss), so an unauthenticated burst can starve the event loop. The
// limit below is intentionally generous for a demo — 200 requests per
// minute per IP keeps the gallery and developer-tools refresh loops happy
// while still capping abusive clients. Tune for your traffic profile in
// production.
const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
app.use(limiter);

// Enable CORS for client
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

// Static files directory
const IMAGES_DIR = path.join(__dirname, "../public/images");
const PRIVATE_DIR = path.join(__dirname, "../public/private");

// Conservative allowlist for user IDs that are allowed to map onto a folder
// under `PRIVATE_DIR`. The regex intentionally rejects any character that
// could traverse the filesystem (`..`, `/`, `\`) or smuggle control bytes.
// Keep this in sync with whatever auth/profile layer mints the IDs.
const USER_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

// Create pixel serve middleware
const serveImage = registerServe({
  baseDir: IMAGES_DIR,

  // Handle user IDs
  idHandler: (id: string) => id,

  // Resolve private folders.
  //
  // SECURITY: `userId` arrives directly from the request, so it must be
  // validated before being passed to `path.join`. Without this guard a value
  // like `../images` would resolve to a sibling directory and bypass the
  // intended isolation between users. The framework also runs path-traversal
  // checks downstream, but example code should fail closed at the earliest
  // opportunity so readers borrowing this snippet stay safe by default.
  getUserFolder: async (_req, userId) => {
    // In a real app, you'd verify authentication here.
    if (userId && USER_ID_PATTERN.test(userId)) {
      return path.join(PRIVATE_DIR, userId);
    }
    // Fallback to the public images folder when the userId is missing or
    // fails validation. The framework's `onError` pipeline will surface the
    // mismatch via `getUserFolderRootDir` if the resolved path ever escapes.
    return IMAGES_DIR;
  },

  // Defense-in-depth: even if the `getUserFolder` callback above were to
  // change and accidentally return a path outside `PRIVATE_DIR`, the
  // framework will reject it and fall back to `baseDir`.
  getUserFolderRootDir: PRIVATE_DIR,

  // Your website URL (for treating internal URLs as local). A bare hostname
  // is deliberate: pixel-serve-server normalizes websiteURL to a hostname
  // for the primary comparison, so a port suffix here would be inert but
  // would also go stale the moment PORT (above) is overridden via env var.
  websiteURL: "localhost",

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

// Capture the HTTP server instance so we can wire signal handlers below. We
// also attach an `error` listener: `listen()` reports `EADDRINUSE` and friends
// asynchronously, so without this the process would exit silently if the
// port were busy.
const server = app
  .listen(PORT, HOST, () => {
    console.log(
      `🚀 Pixel Serve Test Server running on http://${HOST}:${PORT}`
    );
    console.log(
      `📸 Image endpoint: http://${HOST}:${PORT}/api/pixel/serve`
    );
    console.log(`💚 Health check: http://${HOST}:${PORT}/api/health`);
  })
  .on("error", (err) => {
    console.error("Server failed to start:", err);
    process.exit(1);
  });

// Graceful shutdown. On SIGTERM/SIGINT we stop accepting new connections and
// let in-flight requests drain, then exit. A 10s safety timer guarantees the
// process exits even if a keep-alive socket is stuck — important when running
// under a supervisor (Docker, PM2, systemd) that will SIGKILL after a grace
// period anyway.
const SHUTDOWN_TIMEOUT_MS = 10_000;
let shuttingDown = false;

const shutdown = (signal: NodeJS.Signals): void => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}, shutting down gracefully...`);

  const forceExit = setTimeout(() => {
    console.error(
      `Forcing exit after ${SHUTDOWN_TIMEOUT_MS}ms — stuck connections did not close in time.`
    );
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  // Don't let the timer keep the event loop alive if everything closes early.
  forceExit.unref();

  server.close((err) => {
    if (err) {
      console.error("Error during server.close():", err);
      process.exit(1);
    }
    process.exit(0);
  });
};

(["SIGTERM", "SIGINT"] as const).forEach((signal) => {
  process.on(signal, () => shutdown(signal));
});
