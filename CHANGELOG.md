# Changelog

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.4] - 2026-05-12

### Added

- **GitHub Actions integration CI.** New `.github/workflows/ci.yml` runs on push to `main` and on every PR across Node 20.x / 22.x / 24.x. Because this repo's two workspaces depend on the sibling library repos via `file:../../pixel-serve-server` and `file:../../pixel-serve-client`, the workflow checks out all three repos as siblings under `${{ github.workspace }}/` (using `actions/checkout@v6` with explicit `repository:` + `path:` parameters), runs `npm ci && npm run build` in each library, then runs `npm install` + `npm run type-check` + `npm run build` in this workspace, and finally smoke-tests the demo server by spawning `npm start` in `server/` and probing `/api/health` and `/api/info` over loopback. Concurrency group cancels superseded pushes; `permissions: contents: read` enforces least-privilege; runners cap at 20 minutes; checkouts run with `persist-credentials: false`. (`.github/workflows/ci.yml`)
- **CodeQL static analysis.** New `.github/workflows/codeql.yml` runs on push, PR, and weekly cron (`0 6 * * 1`) using `github/codeql-action@v4` with the `security-and-quality` query suite. Capped at 30 minutes with only `security-events: write` + read scopes. (`.github/workflows/codeql.yml`)
- **Issue / PR / contact templates.** `.github/PULL_REQUEST_TEMPLATE.md` (workspace dropdown, `npm run dev` / `npm run build` / `npm run type-check` checklist, manual visual verification reminder), `.github/ISSUE_TEMPLATE/bug_report.yml` (workspace dropdown, Node + OS, repro/expected/actual), `.github/ISSUE_TEMPLATE/feature_request.yml`, and `.github/ISSUE_TEMPLATE/config.yml` that disables blank issues and routes `pixel-serve-server` / `pixel-serve-client` bugs to their own repos while pointing security reports at GitHub Security Advisories. (`.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/*`)
- **README badges.** Added CI and CodeQL status badges. (`README.md`)
- **CHANGELOG `[Unreleased]` section.** Added the Keep a Changelog header and a placeholder `## [Unreleased]` heading so future tooling that promotes `[Unreleased]` → `[X.Y.Z] - <date>` has a target to operate on. (`CHANGELOG.md`)

### Notes

- Patch bump (`1.2.3` → `1.2.4`): tooling-only — no workspace source changes, no dependency bumps. The repo remains `private: true` and is not published to npm; only the two sibling library repos publish on tag push. `npm run type-check` and `npm run build` pass across both `server/` and `client/` workspaces.

## [1.2.3] - 2026-05-12

### Dependencies

- **Vite 7.3.3 → 8.0.12 and `@vitejs/plugin-react` 5.1.1 → 6.0.1 (`client/`).** Major bumps that must travel together — `@vitejs/plugin-react@6` declares `vite >=8` as its peer. Vite 8 replaces esbuild/Rollup with Rolldown and Oxc for both bundling and dev-server transforms; the `vite.config.ts` is small enough (just `react()` plus a dev proxy to `:3001`) that no migration was needed — no `esbuild`, `optimizeDeps.esbuildOptions`, `transformWithEsbuild`, or `build.rollupOptions.output.manualChunks` (object form) usage. Browser baseline raised to Chrome 111 / Edge 111 / Firefox 114 / Safari 16.4 (project has no browser-target overrides). Dev server still starts in <500 ms; production build still completes in ~200 ms. (`client/package.json`, `client/vite.config.ts`)
- **`express-rate-limit` 7.5.0 → 8.5.1 (`server/`).** Major bump. The demo's `rateLimit({ windowMs, limit, standardHeaders: "draft-7", legacyHeaders: false })` call already uses the v8-preferred `limit` (over the deprecated `max`) and `standardHeaders: "draft-7"` headers, so no source changes were needed. The v8 defaults that did kick in — IPv6 `/56` subnet masking and per-user reset windows instead of a global window — strictly improve abuse resistance without affecting the demo's request shape. The `req.rateLimit.current` → `req.rateLimit.used` rename is not load-bearing because the demo never reads this surface. Verified live: `RateLimit-Policy: 200;w=60` and `RateLimit: limit=200, remaining=…, reset=60` headers emitted correctly. (`server/package.json`, `server/src/index.ts`)
- **TypeScript 5.9.3 → 6.0.3 (`server/` + `client/`).** Major bump. Both workspaces' `tsconfig.json` already pin every option that TypeScript 6 changed defaults for, so no source changes were required. No `ignoreDeprecations` workaround was needed because neither workspace uses `tsup`/`rollup-plugin-dts` (the demo `server` compiles with `tsc`, the demo `client` uses Vite). (`server/package.json`, `client/package.json`)
- **Workspace dependencies refreshed.** Inner pinned packages bumped to the latest local builds: `pixel-serve-server` (server workspace) and `pixel-serve-client` (client workspace) updated to consume the new builds produced after the `pixel-serve-server` and `pixel-serve-client` 2.8.2 / 1.1.6 dependency refreshes. React 19.2.1 → 19.2.6, `@types/react` 19.2.7 → 19.2.14, `cors` 2.8.5 → 2.8.6, `@types/node` 24 → 25. (`server/package.json`, `client/package.json`)

### Notes

- Patch bump (`1.2.2` → `1.2.3`): dependency-only update. No source code changes. `npm run type-check` and `npm run build` both pass on `server/` and `client/`. The dev server (`npm run dev:server`) starts cleanly and returns rate-limit headers in the new v8 draft-7 format; the Vite 8 dev server (`npm run dev:client`) starts in 335 ms. End-to-end image fetch (`/api/pixel/serve?src=avatar1.jpg&format=webp&width=200&height=200&type=avatar`) returns a 7144-byte WebP `200 OK` through the upgraded stack.

## [1.2.2] - 2026-05-12

### Security / Dependencies

- **`npm audit fix` applied (Task 13).** Resolved 4 dev-time advisories (1 moderate, 3 high) reported by `npm audit` against the test/demo workspace. Fixed: `picomatch` (high — POSIX class injection and ReDoS via extglob quantifiers, GHSA-3v7f-55p6-f55p, GHSA-c2c7-rcm5-vvqj), `postcss` (moderate — XSS via unescaped `</style>` in stringify output, GHSA-qx2v-qp2m-jg93), `rollup` (high — arbitrary file write via path traversal, GHSA-mw96-cpmx-2vgc), and `vite` (high — three advisories: path traversal in optimized deps `.map` handling, `server.fs.deny` bypass via queries, arbitrary file read via dev-server websocket; GHSA-4w7w-66w2-5vf9, GHSA-v2wj-q39q-566r, GHSA-p9ff-h696-f583). All advisories were in the `client/` workspace via transitive dependencies of `vite`; the demo `server/` workspace had no advisories. No production runtime exposure (this package is a private integration test app, not published to npm). (`package-lock.json`, `client/package-lock.json`)

### Notes

- Patch bump (`1.2.1` → `1.2.2`): dependency-only update via `npm audit fix` (no `--force`). Final `npm audit` reports 0 vulnerabilities across root, `server/`, and `client/` workspaces. `npm run build` and `npm run type-check` pass on both workspaces.

## [1.2.1] - 2026-05-12

### Engineering

- **Node engine pinned to `>=20` (Task 12).** `package.json#engines.node` updated from `>=18` to `>=20` across the workspace root, the `server/` workspace, and the `client/` workspace (the per-workspace `package.json` files previously had no `engines` field at all — they now declare the same Node 20 minimum to match the root). Node 18 reached end-of-life on 2025-04-30, and the existing toolchain (Vite 7, tsx 4, Sharp 0.34 via `pixel-serve-server`) already requires Node 20+. (`package.json`, `server/package.json`, `client/package.json`)

## [1.2.0] - 2026-05-12

### Added

- **Helmet security headers.** Mounted `helmet({ contentSecurityPolicy: false })` early in the middleware chain so the demo emits a standard security header baseline (`X-Content-Type-Options: nosniff`, `X-Frame-Options`, `Referrer-Policy`, etc.). CSP is intentionally disabled because the demo client renders with inline styles; production consumers should re-enable CSP with an allowlist tailored to their bundle. New dependency: `helmet@^8.1.0`. (`server/src/index.ts`, `server/package.json`)
- **`express-rate-limit` baseline.** Added a generous 200 requests/minute/IP limiter to protect the CPU-heavy Sharp pipeline from accidental request storms. Uses `standardHeaders: "draft-7"` for RateLimit-* surface and disables the legacy X-RateLimit-* headers. New dependency: `express-rate-limit@^7.5.0`. (`server/src/index.ts`, `server/package.json`)
- **`CORS_ORIGIN` environment override.** The CORS origin is now read from `process.env.CORS_ORIGIN`, defaulting to `http://localhost:5173`. Multiple origins can be supplied as a comma-separated list (e.g. `CORS_ORIGIN="http://localhost:5173,https://demo.example.com"`) — entries are trimmed and the resulting array is forwarded to `cors()` so reflected `Access-Control-Allow-Origin` values still match the requesting host. (`server/src/index.ts`)
- **README: demo security baseline section.** Documented Helmet, rate limiting, and the new `CORS_ORIGIN` override so readers borrowing the demo as a starting point understand the production-flavored defaults. (`README.md`)

## [1.1.0] - 2026-05-12

### Added

- **`userId` allowlist validation in `getUserFolder`.** The demo callback now rejects any `userId` that does not match `/^[a-zA-Z0-9_-]{1,64}$/`, falling back to the public images directory. Without this guard a request like `?userId=../images` would have resolved to an unintended folder. Also wires the new `getUserFolderRootDir` option pointing at `PRIVATE_DIR` so the framework enforces containment as defense-in-depth. (`server/src/index.ts`)
- **Configurable bind address with safe default.** `app.listen()` now binds to `127.0.0.1` by default (override with `HOST=0.0.0.0` or any interface). Added a `listen` error handler that logs `EADDRINUSE`-style failures and exits with code 1 instead of going silent. (`server/src/index.ts`)
- **Graceful shutdown on SIGTERM/SIGINT.** The server instance is captured from `app.listen()` and `server.close()` is invoked on signal so in-flight requests drain. A 10s safety timer forces `process.exit(1)` if a keep-alive socket refuses to close — important when running under Docker/PM2/systemd. (`server/src/index.ts`)

## [1.0.4] - 2026-05-12

### Security / Dependencies

- **`npm audit fix` applied to `server/`.** Resolved two transitive advisories: `path-to-regexp` (high — ReDoS via sequential optional groups and multi-wildcards) and `qs` (moderate — arrayLimit bypass DoS). `client/` had zero advisories. Verified with `npm audit --omit=dev` showing 0 vulnerabilities across the workspace afterwards. (`server/package-lock.json`)

## [1.0.3] - 2026-05-12

### Added

- **`type-check` npm scripts.** Added `"type-check": "tsc --noEmit"` to `server/package.json` and `client/package.json`, and `"type-check": "npm run type-check --workspaces --if-present"` to the workspace root so the documented pre-completion checklist can be honored. (`package.json`, `server/package.json`, `client/package.json`)

## [1.0.2] - 2026-02-22

### Fixed

- **README section count** — Updated test section documentation from 11 to 12 sections, adding the missing "Private" section at position 8 with correct numbering for all subsequent sections. (`README.md`)

## [1.0.1] - 2026-02-22

### Added

- **Private Images section** — New test section demonstrating `folder="private"` and `userId` props for accessing per-user private image directories. Includes tests for different users, avatar access, missing userId fallback, and invalid user fallback. (`client/src/App.tsx`)
- **Private folder test images** — Added test images (`photo.jpg`, `avatar.jpg`) to `server/public/private/user1/` and `server/public/private/user2/` directories.

### Fixed

- **WCAG AA color contrast** — Changed `--text-muted` color from `#606070` (~1.5:1 contrast ratio) to `#8a8a9a` (~5:1 ratio) for accessibility compliance. (`client/src/index.css`)
- **Touch device hover states** — Wrapped all card hover transforms (`translateY`, `scale`) with `@media (hover: hover)` to prevent persistent hover effects on touch devices. (`client/src/App.css`)
