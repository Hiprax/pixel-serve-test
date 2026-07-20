import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Response } from "supertest";
import { createApp } from "../src/app";

const app = createApp();

// supertest does not buffer unknown/binary content-types by default, so attach
// a parser that concatenates the raw response bytes into a Buffer (mirrors the
// pixel-serve-server test suite).
const bufferParser = (
  res: Response,
  callback: (err: Error | null, buffer: Buffer) => void,
): void => {
  const chunks: Buffer[] = [];
  res.on("data", (chunk: Buffer) =>
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
  );
  res.on("end", () => callback(null, Buffer.concat(chunks)));
};

// A PNG's IHDR chunk stores width/height as big-endian uint32 at byte offsets
// 16 and 20 (8-byte signature + 4-byte length + 4-byte "IHDR" type). Reading
// them lets us assert the ACTUAL decoded dimensions of a PNG response without
// pulling in an image-decoding dependency.
const pngSize = (buf: Buffer): { width: number; height: number } => ({
  width: buf.readUInt32BE(16),
  height: buf.readUInt32BE(20),
});

const PIXEL = "/api/pixel/serve";

describe("health and info endpoints", () => {
  it("GET /api/health returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET /api/info advertises the wildcard picsum host", async () => {
    const res = await request(app).get("/api/info");
    expect(res.status).toBe(200);
    expect(res.body.allowedExternalHosts).toContain("*.picsum.photos");
  });
});

describe("local image serving", () => {
  it("serves a resized local image with the requested content-type", async () => {
    const res = await request(app)
      .get(PIXEL)
      .query({ src: "landscape1.jpg", width: 200, height: 150, format: "webp" })
      .parse(bufferParser);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("image/webp");
    expect(res.body.length).toBeGreaterThan(0);
    // A genuine resolve is cached under the operator's long policy; a soft
    // fallback would use the short `public, max-age=60`.
    expect(res.headers["cache-control"]).toBe("public, max-age=3600");
  });

  it.each([
    ["jpeg", "image/jpeg"],
    ["png", "image/png"],
    ["webp", "image/webp"],
    ["avif", "image/avif"],
    ["gif", "image/gif"],
    ["tiff", "image/tiff"],
  ])("serves format=%s as %s", async (format, contentType) => {
    const res = await request(app)
      .get(PIXEL)
      .query({ src: "landscape1.jpg", width: 120, height: 120, format })
      .parse(bufferParser);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe(contentType);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe("small avatars (the sub-50 dimension fix)", () => {
  it.each([32, 48])(
    "serves a true %dpx avatar (previously fell back to a placeholder)",
    async (size) => {
      const res = await request(app)
        .get(PIXEL)
        .query({
          src: "avatar1.jpg",
          width: size,
          height: size,
          format: "png",
          type: "avatar",
        })
        .parse(bufferParser);
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toBe("image/png");
      // Decoded dimensions prove it was genuinely resized to the small size,
      // not clamped up or replaced by the native-size hard-fallback placeholder.
      expect(pngSize(res.body)).toEqual({ width: size, height: size });
      // ...and the long cache policy proves it is not a SOFT fallback either:
      // a soft fallback is Sharp-resized to the requested size too, so it would
      // satisfy the dimension assertion above while carrying `max-age=60`.
      expect(res.headers["cache-control"]).toBe("public, max-age=3600");
    },
  );
});

describe("private folder access", () => {
  it("serves a private image for a valid userId", async () => {
    const res = await request(app)
      .get(PIXEL)
      .query({
        src: "photo.jpg",
        folder: "private",
        userId: "user1",
        width: 200,
        height: 150,
        format: "webp",
      })
      .parse(bufferParser);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("image/webp");
    expect(res.body.length).toBeGreaterThan(0);
    // user1/photo.jpg exists → genuine resolve, long cache policy.
    expect(res.headers["cache-control"]).toBe("public, max-age=3600");
  });

  it("falls back gracefully when userId is missing for a private request", async () => {
    // No userId → getUserFolder returns the public baseDir, which has no
    // photo.jpg → soft fallback (still a valid 200 image, short cache policy).
    const res = await request(app)
      .get(PIXEL)
      .query({ src: "photo.jpg", folder: "private", format: "jpeg" })
      .parse(bufferParser);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("image/jpeg");
    expect(res.headers["cache-control"]).toBe("public, max-age=60");
  });
});

describe("graceful fallbacks (security pipeline)", () => {
  it("falls back for a blocked (non-allowlisted) host", async () => {
    const res = await request(app)
      .get(PIXEL)
      .query({ src: "https://evil.example.com/x.jpg", format: "jpeg" })
      .parse(bufferParser);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("image/jpeg");
    // Blocked host → soft fallback → short cache policy (never cached long).
    expect(res.headers["cache-control"]).toBe("public, max-age=60");
  });

  it("falls back for a path-traversal attempt", async () => {
    const res = await request(app)
      .get(PIXEL)
      .query({ src: "../../package.json", format: "jpeg" })
      .parse(bufferParser);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("image/jpeg");
  });

  it("hard-falls-back for an above-window dimension (verbatim placeholder ignores requested format)", async () => {
    // width above the 2000 operator ceiling / 4000 framework ceiling → schema
    // rejects → hard fallback serves noimage.jpg VERBATIM as image/jpeg,
    // ignoring the requested png. Content-type image/jpeg (not png) is the
    // non-vacuous proof it fell back rather than resizing.
    const res = await request(app)
      .get(PIXEL)
      .query({ src: "landscape1.jpg", width: 5000, format: "png" })
      .parse(bufferParser);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("image/jpeg");
  });
});

describe("network fetch through the wildcard allowlist (picsum redirect)", () => {
  let hasInternet = false;

  beforeAll(async () => {
    // The demo server fetches picsum server-side; probe from the test process
    // (same host, same connectivity) so the suite skips cleanly offline / in
    // CI without internet rather than reporting a false failure.
    try {
      const res = await fetch("https://picsum.photos/seed/probe/16/16", {
        redirect: "follow",
        signal: AbortSignal.timeout(6000),
      });
      hasInternet = res.ok;
    } catch {
      hasInternet = false;
    }
  });

  it("fetches a real picsum image via the redirect to fastly.picsum.photos", async (ctx) => {
    if (!hasInternet) {
      ctx.skip();
      return;
    }
    const res = await request(app)
      .get(PIXEL)
      .query({
        src: "https://picsum.photos/seed/net1/800/600",
        width: 400,
        height: 300,
        format: "webp",
      })
      .parse(bufferParser);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("image/webp");
    // The load-bearing assertion: a GENUINE fetch is cached under the long
    // operator policy. A soft fallback (which is what a rejected redirect hop
    // would have produced before the wildcard fix) would carry the short
    // `public, max-age=60` instead. This proves the CDN-subdomain redirect was
    // actually followed and the real image returned.
    expect(res.headers["cache-control"]).toBe("public, max-age=3600");
    expect(res.body.length).toBeGreaterThan(0);
  });
});
