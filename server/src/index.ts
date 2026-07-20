// Explicit `.js` extension: this package is `"type": "module"`, so the built
// output is loaded by Node's ESM resolver (`npm start` → `node dist/index.js`),
// which does not resolve extensionless relative specifiers. TypeScript maps the
// `.js` specifier back to `app.ts` at compile time. Omitting it still type-
// checks and still works under tsx/vitest, but crashes the built server with
// ERR_MODULE_NOT_FOUND.
import { createApp } from "./app.js";

const PORT = Number(process.env.PORT) || 3001;
// Bind to loopback by default so the demo server is not exposed on the LAN.
// Operators who explicitly want to listen on every interface can opt in by
// setting `HOST=0.0.0.0` (or any interface address) before starting the
// process. Keeping the default narrow is a defense-in-depth measure that
// also matches how most local dev servers ship.
const HOST = process.env.HOST || "127.0.0.1";

const app = createApp();

// Capture the HTTP server instance so we can wire signal handlers below. We
// also attach an `error` listener: `listen()` reports `EADDRINUSE` and friends
// asynchronously, so without this the process would exit silently if the
// port were busy.
const server = app
  .listen(PORT, HOST, () => {
    console.log(`🚀 Pixel Serve Test Server running on http://${HOST}:${PORT}`);
    console.log(`📸 Image endpoint: http://${HOST}:${PORT}/api/pixel/serve`);
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
      `Forcing exit after ${SHUTDOWN_TIMEOUT_MS}ms — stuck connections did not close in time.`,
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
