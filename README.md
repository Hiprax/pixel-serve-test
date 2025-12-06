# Pixel Serve Integration Test

This is a comprehensive integration test application for the `pixel-serve-server` and `pixel-serve-client` packages.

## Structure

```text
test/
├── server/          # Express server using pixel-serve-server
│   ├── src/
│   │   └── index.ts
│   └── public/
│       ├── images/  # Public images
│       └── private/ # Private user folders
│           ├── user1/
│           └── user2/
├── client/          # React app using pixel-serve-client
│   └── src/
│       ├── App.tsx
│       ├── App.css
│       └── main.tsx
└── package.json
```

## Setup

1. **Install root packages dependencies:**

```bash
cd pixel-serve
npm install
```

1.1. **Build both packages:**

```bash
cd pixel-serve-server && npm run build && cd ..
cd pixel-serve-client && npm run build && cd ..
```

1.2. **Install test app dependencies:**

```bash
cd test
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

## Running the Test

### Option 1: Run Both Together (Recommended)

```bash
cd test
npm run dev
```

This starts both the server (port 3001) and client (port 5173) concurrently.

### Option 2: Run Separately

In terminal 1:

```bash
cd test/server
npm run dev
```

In terminal 2:

```bash
cd test/client
npm run dev
```

## Access

- **Client UI:** [http://localhost:5173/](http://localhost:5173/)
- **Server API:** [http://localhost:3001/](http://localhost:3001/)
- **Health Check:** [http://localhost:3001/api/health/](http://localhost:3001/api/health/)
- **Image Endpoint:** [http://localhost:3001/api/pixel/serve/](http://localhost:3001/api/pixel/serve/)

## Test Sections

The test UI covers the following scenarios:

1. **Basic Usage** - Simple image rendering with auto format optimization
2. **Formats** - Testing different output formats (JPEG, PNG, WebP, AVIF)
3. **Sizes & Quality** - Different dimensions and quality settings
4. **Avatars** - Avatar mode with circular skeleton and fallbacks
5. **Background Mode** - Hero images and cover backgrounds
6. **Direct Mode** - Bypassing the backend for direct URLs
7. **Private Folders** - User-specific private image access
8. **Network Images** - Fetching from allowed external hosts
9. **Helper Functions** - Using `buildPixelUrl` and `buildPixelSources`
10. **Error Handling** - Graceful fallbacks for various error scenarios

## Server Configuration

The test server is configured with:

- **Base directory:** `./public/images`
- **Private directory:** `./public/private/{userId}`
- **Allowed external hosts:**
  - `images.unsplash.com`
  - `picsum.photos`
  - `placekitten.com`
  - `via.placeholder.com`
- **Image bounds:** 50-2000px
- **Default quality:** 80
- **Cache:** 1 hour
- **ETag:** Enabled

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
- The client proxies `/api` requests to the server

**Images not loading:**

- Check server logs for errors
- Verify image files exist in the correct directories
- Check browser console for CORS issues
