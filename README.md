# Pixel Serve Integration Test

A comprehensive integration test and visual demo application for the [`pixel-serve-server`](https://www.npmjs.com/package/pixel-serve-server) and [`pixel-serve-client`](https://www.npmjs.com/package/pixel-serve-client) packages.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Structure

```text
pixel-serve-test/
├── package.json             # Workspace root (npm workspaces)
├── server/                  # Express server using pixel-serve-server
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts
├── client/                  # React app using pixel-serve-client
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── App.css
│       └── index.css
└── server/public/
    ├── images/              # Public test images
    └── private/             # Private user folders
        ├── user1/
        └── user2/
```

## Setup

1. **Install root package dependencies:**

```bash
cd pixel-serve
npm install
```

2. **Build both packages:**

```bash
cd pixel-serve-server && npm run build && cd ..
cd pixel-serve-client && npm run build && cd ..
```

3. **Install test app dependencies:**

```bash
cd pixel-serve-test
npm install
```

## Running the Test

### Option 1: Run Both Together (Recommended)

```bash
cd pixel-serve-test
npm run dev
```

This starts both the server (port 3001) and client (port 5173) concurrently.

### Option 2: Run Separately

In terminal 1:

```bash
cd pixel-serve-test/server
npm run dev
```

In terminal 2:

```bash
cd pixel-serve-test/client
npm run dev
```

## Access

- **Client UI:** [http://localhost:5173](http://localhost:5173)
- **Server API:** [http://localhost:3001](http://localhost:3001)
- **Health Check:** [http://localhost:3001/api/health](http://localhost:3001/api/health)
- **Image Endpoint:** [http://localhost:3001/api/pixel/serve](http://localhost:3001/api/pixel/serve)

## Test Sections

The test UI covers 12 scenarios across all features:

| #   | Section             | Description                                                                    |
| --- | ------------------- | ------------------------------------------------------------------------------ |
| 1   | **Basic Usage**     | Simple image rendering with auto format optimization                           |
| 2   | **Local Images**    | Server-side local image serving and avatar display                             |
| 3   | **Formats**         | Output formats (JPEG, PNG, WebP, AVIF) and progressive enhancement             |
| 4   | **Sizes & Quality** | Dimension variants and quality level comparisons                               |
| 5   | **Avatars**         | Avatar mode with circular skeleton loaders and fallbacks                       |
| 6   | **Background**      | Hero banners, feature cards, and magazine layouts with overlays                |
| 7   | **Direct**          | Bypassing the backend for direct URLs, data URIs, and CDN images               |
| 8   | **Private**         | Private folder access with userId-based directories and fallbacks              |
| 9   | **Network**         | Fetching and processing external images with host validation                   |
| 10  | **Gallery**         | Responsive grid, lazy loading, and masonry layout patterns                     |
| 11  | **Helpers**         | `buildPixelUrl()` and `buildPixelSources()` function demonstrations            |
| 12  | **Errors**          | Graceful fallbacks for missing images, blocked hosts, path traversal, and more |

## Server Configuration

The test server is configured with:

| Setting                    | Value                                                                            |
| -------------------------- | -------------------------------------------------------------------------------- |
| **Base directory**         | `./public/images`                                                                |
| **Private directory**      | `./public/private/{userId}`                                                      |
| **Allowed external hosts** | `images.unsplash.com`, `picsum.photos`, `placekitten.com`, `via.placeholder.com` |
| **Image bounds**           | 50-2000px                                                                        |
| **Default quality**        | 80                                                                               |
| **Cache**                  | 1 hour (`public, max-age=3600`)                                                  |
| **ETag**                   | Enabled                                                                          |
| **Request timeout**        | 10 seconds                                                                       |
| **Max download size**      | 10MB                                                                             |

## Adding Test Images

Place test images in:

- `server/public/images/` - For public images
- `server/public/private/user1/` - For user1's private images
- `server/public/private/user2/` - For user2's private images

## Troubleshooting

**Server won't start:**

- Make sure `pixel-serve-server` is built (`npm run build` in the package directory)
- Check if port 3001 is available

**Client can't connect:**

- Ensure the server is running first
- The client proxies `/api` requests to the server via Vite proxy

**Images not loading:**

- Check server logs for errors
- Verify image files exist in the correct directories
- Check browser console for CORS issues

## License

MIT
