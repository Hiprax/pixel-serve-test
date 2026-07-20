import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerServe } from "pixel-serve-server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static files directories.
export const IMAGES_DIR = path.join(__dirname, "../public/images");
export const PRIVATE_DIR = path.join(__dirname, "../public/private");

// Conservative allowlist for user IDs that are allowed to map onto a folder
// under `PRIVATE_DIR`. The regex intentionally rejects any character that
// could traverse the filesystem (`..`, `/`, `\`) or smuggle control bytes.
// Keep this in sync with whatever auth/profile layer mints the IDs.
export const USER_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

// External hosts the demo is allowed to fetch from. `picsum.photos` issues a
// cross-host 302 redirect to a CDN subdomain (`fastly.picsum.photos` /
// `i.picsum.photos`); the manual SSRF redirect loop re-validates every hop
// against this list, so a bare `picsum.photos` entry would reject the CDN hop
// and serve a placeholder. The `*.picsum.photos` wildcard covers the apex and
// every CDN subdomain. The wildcard relaxes only the hostname allowlist — the
// per-hop public-IP DNS guard still runs, so it cannot reach a private IP.
export const ALLOWED_NETWORK_LIST = [
  "images.unsplash.com",
  "picsum.photos",
  "*.picsum.photos",
  "placekitten.com",
  "via.placeholder.com",
];

const DEFAULT_CORS_ORIGIN = "http://localhost:5173";

const resolveCorsOrigin = (): string | string[] => {
  const list = (process.env.CORS_ORIGIN ?? DEFAULT_CORS_ORIGIN)
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  return list.length > 1 ? list : (list[0] ?? DEFAULT_CORS_ORIGIN);
};

/**
 * Builds the fully-wired Express app (security headers, rate limiting, CORS,
 * the pixel-serve middleware, and the health/info endpoints) WITHOUT binding
 * to a port. `index.ts` calls this and then `listen()`s; the integration test
 * suite calls it and drives it with supertest — so the tests exercise the same
 * middleware configuration the demo actually runs.
 */
export const createApp = (): express.Express => {
  const app = express();

  // Security headers via Helmet. CSP is intentionally disabled because the
  // demo React client renders with inline styles, which a strict default CSP
  // would block. Production deployments should re-enable CSP with an allowlist
  // tailored to their bundle.
  app.use(helmet({ contentSecurityPolicy: false }));

  // Rate limiting. Image processing is CPU-heavy (Sharp decodes, resizes, and
  // re-encodes on every miss), so an unauthenticated burst can starve the
  // event loop. 200 requests/min per IP keeps the gallery and dev-tools
  // refresh loops happy while still capping abusive clients.
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: 200,
      standardHeaders: "draft-7",
      legacyHeaders: false,
    }),
  );

  app.use(cors({ origin: resolveCorsOrigin(), credentials: true }));

  const serveImage = registerServe({
    baseDir: IMAGES_DIR,

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
    // would also go stale the moment PORT is overridden via env var.
    websiteURL: "localhost",

    // API prefix to strip from internal URLs
    apiRegex: /^\/api\//,

    // Allowed external image sources (see ALLOWED_NETWORK_LIST above).
    allowedNetworkList: ALLOWED_NETWORK_LIST,

    // Cache settings
    cacheControl: "public, max-age=3600",
    etag: true,

    // Image bounds. minWidth/minHeight are lowered below the old 50 floor so
    // small avatars/icons (32px, 48px) are served at their true size rather
    // than being clamped up or rejected.
    minWidth: 16,
    maxWidth: 2000,
    minHeight: 16,
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
      allowedExternalHosts: ALLOWED_NETWORK_LIST,
    });
  });

  return app;
};
