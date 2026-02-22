# Changelog

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
