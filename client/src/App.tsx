import { useState, useEffect } from "react";
import Pixel, {
  buildPixelUrl,
  buildPixelSources,
  Skeleton,
} from "pixel-serve-client";
import "./App.css";

type TestSection =
  | "basic"
  | "local"
  | "formats"
  | "sizes"
  | "avatars"
  | "background"
  | "direct"
  | "private"
  | "network"
  | "helpers"
  | "gallery"
  | "errors";

const API_URL = "/api/pixel/serve";

// Local images stored on the server (test/server/public/images/)
// Paths are relative to the server's baseDir (no leading slash)
const LOCAL_IMAGES = {
  landscape1: "landscape1.jpg",
  landscape2: "landscape2.jpg",
  hero: "hero.jpg",
  portrait: "portrait.jpg",
  square: "square.jpg",
  card1: "card1.jpg",
  card2: "card2.jpg",
  card3: "card3.jpg",
  avatar1: "avatar1.jpg",
  avatar2: "avatar2.jpg",
};

// Network images from allowed hosts for network tests
const NETWORK_IMAGES = {
  landscape1: "https://picsum.photos/seed/landscape1/800/600",
  landscape2: "https://picsum.photos/seed/landscape2/800/600",
  portrait1: "https://picsum.photos/seed/portrait1/600/800",
  square1: "https://picsum.photos/seed/square1/500/500",
  avatar3: "https://picsum.photos/seed/avatar3/200/200",
};

// Combined sample images - prioritize local, fallback to network
const SAMPLE_IMAGES = {
  landscape1: LOCAL_IMAGES.landscape1,
  landscape2: LOCAL_IMAGES.landscape2,
  landscape3: "https://picsum.photos/seed/landscape3/800/600",
  portrait1: LOCAL_IMAGES.portrait,
  portrait2: "https://picsum.photos/seed/portrait2/600/800",
  square1: LOCAL_IMAGES.square,
  square2: "https://picsum.photos/seed/square2/500/500",
  avatar1: LOCAL_IMAGES.avatar1,
  avatar2: LOCAL_IMAGES.avatar2,
  avatar3: NETWORK_IMAGES.avatar3,
  hero1: LOCAL_IMAGES.hero,
  hero2: "https://picsum.photos/seed/hero2/1920/400",
  card1: LOCAL_IMAGES.card1,
  card2: LOCAL_IMAGES.card2,
  card3: LOCAL_IMAGES.card3,
  nature: "https://picsum.photos/seed/nature/1200/800",
  city: "https://picsum.photos/seed/city/1200/800",
  abstract: "https://picsum.photos/seed/abstract/1200/800",
};

// Gallery images for the new gallery section
const GALLERY_IMAGES = Array.from({ length: 12 }, (_, i) => ({
  src: `https://picsum.photos/seed/gallery${i + 1}/600/400`,
  title: `Gallery Image ${i + 1}`,
}));

function App() {
  const [activeSection, setActiveSection] = useState<TestSection>("basic");
  const [serverStatus, setServerStatus] = useState<
    "checking" | "online" | "offline"
  >("checking");

  // Check server status
  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then(() => setServerStatus("online"))
      .catch(() => setServerStatus("offline"));
  }, []);

  const sections: { id: TestSection; label: string; icon: string }[] = [
    { id: "basic", label: "Basic Usage", icon: "🖼️" },
    { id: "local", label: "Local Images", icon: "📁" },
    { id: "formats", label: "Formats", icon: "🎨" },
    { id: "sizes", label: "Sizes & Quality", icon: "📐" },
    { id: "avatars", label: "Avatars", icon: "👤" },
    { id: "background", label: "Background", icon: "🌄" },
    { id: "direct", label: "Direct", icon: "⚡" },
    { id: "network", label: "Network", icon: "🌐" },
    { id: "gallery", label: "Gallery", icon: "🎭" },
    { id: "helpers", label: "Helpers", icon: "🔧" },
    { id: "errors", label: "Errors", icon: "⚠️" },
  ];

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">📸</span>
            <h1>Pixel Serve</h1>
            <span className="badge">Integration Test</span>
          </div>
          <div className="server-status">
            <span
              className={`status-dot ${serverStatus}`}
              title={`Server: ${serverStatus}`}
            />
            <span className="status-text">
              {serverStatus === "checking" && "Checking server..."}
              {serverStatus === "online" && "Server Online"}
              {serverStatus === "offline" && "Server Offline"}
            </span>
          </div>
        </div>
      </header>

      <nav className="nav">
        <div className="nav-content">
          {sections.map((section) => (
            <button
              key={section.id}
              className={`nav-item ${
                activeSection === section.id ? "active" : ""
              }`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="nav-icon">{section.icon}</span>
              <span className="nav-label">{section.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="main">
        <div className="container">
          {activeSection === "basic" && <BasicSection />}
          {activeSection === "local" && <LocalSection />}
          {activeSection === "formats" && <FormatsSection />}
          {activeSection === "sizes" && <SizesSection />}
          {activeSection === "avatars" && <AvatarsSection />}
          {activeSection === "background" && <BackgroundSection />}
          {activeSection === "direct" && <DirectSection />}
          {activeSection === "network" && <NetworkSection />}
          {activeSection === "gallery" && <GallerySection />}
          {activeSection === "helpers" && <HelpersSection />}
          {activeSection === "errors" && <ErrorsSection />}
        </div>
      </main>

      <footer className="footer">
        <p>
          Built with <code>pixel-serve-server</code> &{" "}
          <code>pixel-serve-client</code>
        </p>
      </footer>
    </div>
  );
}

function BasicSection() {
  return (
    <section className="section animate-in">
      <h2>Basic Usage</h2>
      <p className="section-desc">
        Simple image rendering with automatic format optimization (AVIF → WebP →
        JPEG). Images are fetched from the server and processed in real-time.
      </p>

      <div className="demo-grid">
        <div className="demo-card">
          <h3>🌄 Landscape Image</h3>
          <div className="image-container">
            <Pixel
              src={SAMPLE_IMAGES.landscape1}
              alt="Beautiful landscape"
              width={400}
              height={300}
              backendUrl={API_URL}
            />
          </div>
          <pre className="code">
            {`<Pixel
  src="/images/landscape.jpg"
  width={400}
  height={300}
/>`}
          </pre>
        </div>

        <div className="demo-card">
          <h3>🏙️ City Scene</h3>
          <div className="image-container">
            <Pixel
              src={SAMPLE_IMAGES.landscape2}
              alt="Urban cityscape"
              width={400}
              height={300}
              backendUrl={API_URL}
            />
          </div>
          <pre className="code">
            {`<Pixel
  src="/images/city.jpg"
  alt="Urban cityscape"
  width={400}
  height={300}
/>`}
          </pre>
        </div>

        <div className="demo-card">
          <h3>🎨 Abstract Art</h3>
          <div className="image-container">
            <Pixel
              src={SAMPLE_IMAGES.landscape3}
              alt="Abstract artwork"
              width={400}
              height={300}
              loader={false}
              backendUrl={API_URL}
            />
          </div>
          <pre className="code">
            {`<Pixel
  src="/images/abstract.jpg"
  loader={false}
  width={400}
  height={300}
/>`}
          </pre>
        </div>
      </div>

      <div className="demo-card wide" style={{ marginTop: "1.5rem" }}>
        <h3>📱 Responsive Image</h3>
        <p className="card-desc">
          Images automatically adapt to their container while maintaining aspect
          ratio:
        </p>
        <div className="responsive-demo">
          <Pixel
            src={SAMPLE_IMAGES.nature}
            alt="Nature scene"
            width={1200}
            height={500}
            backendUrl={API_URL}
            dynamicDimension
            style={{ width: "100%", height: "auto", borderRadius: "12px" }}
          />
        </div>
      </div>
    </section>
  );
}

function LocalSection() {
  const localImages = [
    {
      src: LOCAL_IMAGES.landscape1,
      title: "Landscape 1",
      desc: "800×600 landscape photo",
    },
    {
      src: LOCAL_IMAGES.landscape2,
      title: "Landscape 2",
      desc: "800×600 landscape photo",
    },
    {
      src: LOCAL_IMAGES.hero,
      title: "Hero Banner",
      desc: "1920×600 wide banner",
    },
    {
      src: LOCAL_IMAGES.portrait,
      title: "Portrait",
      desc: "600×800 vertical photo",
    },
    {
      src: LOCAL_IMAGES.square,
      title: "Square",
      desc: "500×500 square photo",
    },
    {
      src: LOCAL_IMAGES.card1,
      title: "Card 1",
      desc: "400×300 card image",
    },
    {
      src: LOCAL_IMAGES.card2,
      title: "Card 2",
      desc: "400×300 card image",
    },
    {
      src: LOCAL_IMAGES.card3,
      title: "Card 3",
      desc: "400×300 card image",
    },
  ];

  const avatars = [
    { src: LOCAL_IMAGES.avatar1, name: "User 1" },
    { src: LOCAL_IMAGES.avatar2, name: "User 2" },
  ];

  return (
    <section className="section animate-in">
      <h2>Local Images</h2>
      <p className="section-desc">
        Images stored locally on the server in{" "}
        <code>test/server/public/images/</code>. These demonstrate the core use
        case: serving and optimizing images from your own filesystem.
      </p>

      <div className="demo-card wide">
        <h3>📁 Server-Side Images</h3>
        <p className="card-desc">
          All images below are loaded from the server's local filesystem:
        </p>
        <div className="local-images-grid">
          {localImages.map((img, i) => (
            <div key={i} className="local-image-item">
              <Pixel
                src={img.src}
                alt={img.title}
                width={300}
                height={200}
                backendUrl={API_URL}
                className="local-image"
              />
              <div className="local-image-info">
                <strong>{img.title}</strong>
                <span>{img.desc}</span>
                <code>{img.src}</code>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="demo-card wide" style={{ marginTop: "1.5rem" }}>
        <h3>👤 Local Avatars</h3>
        <p className="card-desc">Avatar images stored on the server:</p>
        <div className="local-avatars-row">
          {avatars.map((avatar, i) => (
            <div key={i} className="local-avatar-item">
              <Pixel
                src={avatar.src}
                alt={avatar.name}
                width={100}
                height={100}
                type="avatar"
                backendUrl={API_URL}
                style={{ borderRadius: "50%" }}
              />
              <span>{avatar.name}</span>
              <code>{avatar.src}</code>
            </div>
          ))}
        </div>
      </div>

      <div className="info-box">
        <span className="info-icon">💡</span>
        <div>
          <strong>Local vs Network:</strong> Local images are read directly from
          disk, making them faster and more reliable. Use local storage for
          static assets and network fetching only for external resources.
        </div>
      </div>
    </section>
  );
}

function FormatsSection() {
  const formats = [
    { name: "jpeg", icon: "📷", desc: "Universal compatibility" },
    { name: "png", icon: "🖼️", desc: "Lossless with transparency" },
    { name: "webp", icon: "🌐", desc: "Modern web format" },
    { name: "avif", icon: "🚀", desc: "Next-gen compression" },
  ] as const;

  return (
    <section className="section animate-in">
      <h2>Output Formats</h2>
      <p className="section-desc">
        Control the output format with the <code>mimeType</code> prop. Each
        format offers different trade-offs between quality, file size, and
        browser support.
      </p>

      <div className="format-grid">
        {formats.map(({ name, icon, desc }) => (
          <div key={name} className="format-card">
            <div className="format-header">
              <span className="format-icon">{icon}</span>
              <div>
                <h3>{name.toUpperCase()}</h3>
                <span className="format-desc">{desc}</span>
              </div>
            </div>
            <div className="image-container">
              <Pixel
                src={SAMPLE_IMAGES.card1}
                alt={`${name} format example`}
                width={350}
                height={220}
                mimeType={name}
                avif={false}
                webp={false}
                backendUrl={API_URL}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="demo-card wide" style={{ marginTop: "1.5rem" }}>
        <h3>🎯 Progressive Enhancement (Default)</h3>
        <p className="card-desc">
          By default, Pixel generates multiple sources for optimal browser
          support. Browsers automatically choose the best format they support:
        </p>
        <div className="format-flow">
          <div className="format-step">
            <span className="step-badge">1st Choice</span>
            <span className="step-format">AVIF</span>
            <span className="step-size">~50% smaller</span>
          </div>
          <div className="format-arrow">→</div>
          <div className="format-step">
            <span className="step-badge">2nd Choice</span>
            <span className="step-format">WebP</span>
            <span className="step-size">~30% smaller</span>
          </div>
          <div className="format-arrow">→</div>
          <div className="format-step">
            <span className="step-badge">Fallback</span>
            <span className="step-format">JPEG</span>
            <span className="step-size">Universal</span>
          </div>
        </div>
        <div className="image-container" style={{ marginTop: "1rem" }}>
          <Pixel
            src={SAMPLE_IMAGES.city}
            alt="Multi-format progressive image"
            width={800}
            height={400}
            backendUrl={API_URL}
          />
        </div>
      </div>
    </section>
  );
}

function SizesSection() {
  const sizes = [
    { width: 80, height: 80, label: "Thumbnail" },
    { width: 150, height: 150, label: "Small" },
    { width: 250, height: 180, label: "Medium" },
    { width: 400, height: 280, label: "Large" },
  ];

  const qualities = [
    { value: 20, label: "Low", desc: "Smallest file" },
    { value: 50, label: "Medium", desc: "Balanced" },
    { value: 80, label: "High", desc: "Default" },
    { value: 100, label: "Maximum", desc: "Best quality" },
  ];

  return (
    <section className="section animate-in">
      <h2>Sizes & Quality</h2>
      <p className="section-desc">
        Fine-tune image dimensions and compression for the perfect balance
        between quality and performance.
      </p>

      <div className="demo-card wide">
        <h3>📐 Dimension Variants</h3>
        <p className="card-desc">
          Resize images on-the-fly to any dimension. Perfect for responsive
          designs:
        </p>
        <div className="sizes-showcase">
          {sizes.map(({ width, height, label }) => (
            <div key={`${width}x${height}`} className="size-item">
              <div className="image-container">
                <Pixel
                  src={SAMPLE_IMAGES.square1}
                  alt={`${label} size`}
                  width={width}
                  height={height}
                  backendUrl={API_URL}
                />
              </div>
              <div className="size-label">
                <strong>{label}</strong>
                <span>
                  {width}×{height}px
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="demo-card wide" style={{ marginTop: "1.5rem" }}>
        <h3>✨ Quality Comparison</h3>
        <p className="card-desc">
          Compare different quality levels. Lower quality = smaller file size:
        </p>
        <div className="quality-showcase">
          {qualities.map(({ value, label, desc }) => (
            <div key={value} className="quality-item">
              <div className="image-container">
                <Pixel
                  src={SAMPLE_IMAGES.landscape1}
                  alt={`Quality ${value}`}
                  width={280}
                  height={180}
                  quality={value}
                  mimeType="jpeg"
                  avif={false}
                  webp={false}
                  backendUrl={API_URL}
                />
              </div>
              <div className="quality-label">
                <span className="quality-badge">{value}%</span>
                <strong>{label}</strong>
                <span className="quality-desc">{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="demo-grid" style={{ marginTop: "1.5rem" }}>
        <div className="demo-card">
          <h3>🔲 Portrait Mode</h3>
          <div className="image-container">
            <Pixel
              src={SAMPLE_IMAGES.portrait1}
              alt="Portrait orientation"
              width={250}
              height={350}
              backendUrl={API_URL}
            />
          </div>
        </div>
        <div className="demo-card">
          <h3>⬛ Square Crop</h3>
          <div className="image-container">
            <Pixel
              src={SAMPLE_IMAGES.square2}
              alt="Square crop"
              width={300}
              height={300}
              backendUrl={API_URL}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function AvatarsSection() {
  const users = [
    { name: "Alice", src: SAMPLE_IMAGES.avatar1 },
    { name: "Bob", src: SAMPLE_IMAGES.avatar2 },
    { name: "Carol", src: SAMPLE_IMAGES.avatar3 },
    { name: "Dave", src: `https://picsum.photos/seed/dave/200/200` },
    { name: "Eve", src: `https://picsum.photos/seed/eve/200/200` },
  ];

  const avatarSizes = [32, 48, 64, 96, 128];

  return (
    <section className="section animate-in">
      <h2>Avatar Mode</h2>
      <p className="section-desc">
        Use <code>type="avatar"</code> for profile pictures with circular
        skeleton loaders and avatar-specific fallback images.
      </p>

      <div className="demo-card wide">
        <h3>👥 User Avatars</h3>
        <p className="card-desc">Real user avatars with different images:</p>
        <div className="users-row">
          {users.map((user) => (
            <div key={user.name} className="user-card">
              <Pixel
                src={user.src}
                alt={`${user.name}'s avatar`}
                type="avatar"
                width={80}
                height={80}
                backendUrl={API_URL}
                style={{
                  borderRadius: "50%",
                  border: "3px solid var(--accent-primary)",
                }}
              />
              <span className="user-name">{user.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="demo-card wide" style={{ marginTop: "1.5rem" }}>
        <h3>📏 Size Variants</h3>
        <p className="card-desc">
          Different avatar sizes for various UI contexts:
        </p>
        <div className="avatar-sizes-row">
          {avatarSizes.map((size) => (
            <div key={size} className="avatar-size-item">
              <Pixel
                src={SAMPLE_IMAGES.avatar1}
                alt={`${size}px avatar`}
                type="avatar"
                width={size}
                height={size}
                backendUrl={API_URL}
                style={{ borderRadius: "50%" }}
              />
              <span className="size-badge">{size}px</span>
            </div>
          ))}
        </div>
      </div>

      <div className="demo-grid" style={{ marginTop: "1.5rem" }}>
        <div className="demo-card">
          <h3>🔄 Loading State</h3>
          <p className="card-desc">Circular skeleton while loading:</p>
          <div className="avatar-showcase">
            <Skeleton width={120} height={120} isCircle />
          </div>
        </div>

        <div className="demo-card">
          <h3>👤 Profile Card</h3>
          <div className="profile-card-demo">
            <Pixel
              src={SAMPLE_IMAGES.avatar2}
              alt="Profile"
              type="avatar"
              width={100}
              height={100}
              backendUrl={API_URL}
              style={{
                borderRadius: "50%",
                border: "4px solid var(--bg-tertiary)",
              }}
            />
            <div className="profile-info">
              <h4>Jane Doe</h4>
              <p>Senior Designer</p>
              <span className="status-badge">Online</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BackgroundSection() {
  return (
    <section className="section animate-in">
      <h2>Background Mode</h2>
      <p className="section-desc">
        Use <code>background</code> prop for hero images, cover backgrounds, and
        full-bleed layouts. Images fill their container with cover fit.
      </p>

      <div className="demo-card wide">
        <h3>🦸 Hero Section</h3>
        <div className="hero-demo">
          <Pixel
            src={SAMPLE_IMAGES.hero1}
            alt="Hero background"
            background
            width={1920}
            height={500}
            backendUrl={API_URL}
          />
          <div className="hero-content">
            <span className="hero-badge">Featured</span>
            <h2>Discover Amazing Places</h2>
            <p>Explore the world's most beautiful destinations</p>
            <button className="hero-cta">Get Started →</button>
          </div>
        </div>
      </div>

      <div className="demo-card wide" style={{ marginTop: "1.5rem" }}>
        <h3>🃏 Feature Cards</h3>
        <p className="card-desc">
          Cards with background images and overlay content:
        </p>
        <div className="feature-cards">
          <div className="feature-card">
            <Pixel
              src={SAMPLE_IMAGES.card1}
              alt="Nature"
              background
              width={400}
              height={300}
              backendUrl={API_URL}
            />
            <div className="feature-card-content">
              <span className="feature-tag">🌲 Nature</span>
              <h4>Forest Adventures</h4>
              <p>Explore pristine wilderness</p>
            </div>
          </div>
          <div className="feature-card">
            <Pixel
              src={SAMPLE_IMAGES.card2}
              alt="Ocean"
              background
              width={400}
              height={300}
              backendUrl={API_URL}
            />
            <div className="feature-card-content">
              <span className="feature-tag">🌊 Ocean</span>
              <h4>Coastal Escapes</h4>
              <p>Relax by the sea</p>
            </div>
          </div>
          <div className="feature-card">
            <Pixel
              src={SAMPLE_IMAGES.card3}
              alt="Mountain"
              background
              width={400}
              height={300}
              backendUrl={API_URL}
            />
            <div className="feature-card-content">
              <span className="feature-tag">⛰️ Mountain</span>
              <h4>Peak Experiences</h4>
              <p>Reach new heights</p>
            </div>
          </div>
        </div>
      </div>

      <div className="demo-card wide" style={{ marginTop: "1.5rem" }}>
        <h3>📰 Magazine Layout</h3>
        <div className="magazine-layout">
          <div className="magazine-main">
            <Pixel
              src={SAMPLE_IMAGES.hero2}
              alt="Featured story"
              background
              width={800}
              height={400}
              backendUrl={API_URL}
            />
            <div className="magazine-main-content">
              <span className="magazine-category">Travel</span>
              <h3>The Ultimate Guide to Hidden Gems</h3>
            </div>
          </div>
          <div className="magazine-sidebar">
            <div className="magazine-small">
              <Pixel
                src={SAMPLE_IMAGES.landscape2}
                alt="Story 1"
                background
                width={400}
                height={200}
                backendUrl={API_URL}
              />
              <span>City Lights</span>
            </div>
            <div className="magazine-small">
              <Pixel
                src={SAMPLE_IMAGES.landscape3}
                alt="Story 2"
                background
                width={400}
                height={200}
                backendUrl={API_URL}
              />
              <span>Wild Shores</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DirectSection() {
  return (
    <section className="section animate-in">
      <h2>Direct Mode</h2>
      <p className="section-desc">
        Use <code>direct</code> to skip the Pixel Serve backend and use URLs
        directly. Perfect for CDN images or data URLs.
      </p>

      <div className="demo-grid">
        <div className="demo-card">
          <h3>🔗 External CDN</h3>
          <div className="image-container">
            <Pixel
              src="https://picsum.photos/seed/direct1/400/300"
              alt="Direct CDN image"
              direct
              width={400}
              height={300}
            />
          </div>
          <pre className="code">
            {`<Pixel
  src="https://cdn.example.com/image.jpg"
  direct
/>`}
          </pre>
        </div>

        <div className="demo-card">
          <h3>🎨 Inline SVG</h3>
          <div className="image-container">
            <Pixel
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%236366f1'/%3E%3Cstop offset='100%25' stop-color='%23ec4899'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='400' height='300'/%3E%3Ctext fill='white' x='200' y='140' text-anchor='middle' font-family='system-ui' font-size='28' font-weight='600'%3EDirect SVG%3C/text%3E%3Ctext fill='white' opacity='0.8' x='200' y='175' text-anchor='middle' font-family='system-ui' font-size='14'%3ENo backend processing%3C/text%3E%3C/svg%3E"
              alt="SVG placeholder"
              direct
              width={400}
              height={300}
            />
          </div>
          <pre className="code">
            {`<Pixel
  src="data:image/svg+xml,..."
  direct
/>`}
          </pre>
        </div>

        <div className="demo-card">
          <h3>🖼️ Already Optimized</h3>
          <div className="image-container">
            <Pixel
              src="https://picsum.photos/seed/direct2/400/300"
              alt="Pre-optimized image"
              direct
              width={400}
              height={300}
            />
          </div>
          <p className="card-desc" style={{ marginTop: "0.5rem" }}>
            Use direct mode for images already optimized by your CDN.
          </p>
        </div>
      </div>

      <div className="info-box" style={{ marginTop: "1.5rem" }}>
        <span className="info-icon">💡</span>
        <div>
          <strong>When to use Direct Mode:</strong>
          <ul style={{ margin: "0.5rem 0 0 1rem", opacity: 0.9 }}>
            <li>Images already optimized by a CDN</li>
            <li>Data URLs (base64, SVG)</li>
            <li>External APIs with their own image processing</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function NetworkSection() {
  const networkImages = [
    {
      src: "https://picsum.photos/seed/net1/800/600",
      title: "Landscape",
      host: "picsum.photos",
    },
    {
      src: "https://picsum.photos/seed/net2/600/800",
      title: "Portrait",
      host: "picsum.photos",
    },
    {
      src: "https://picsum.photos/seed/net3/500/500",
      title: "Square",
      host: "picsum.photos",
    },
    {
      src: "https://picsum.photos/seed/net4/800/400",
      title: "Panorama",
      host: "picsum.photos",
    },
  ];

  return (
    <section className="section animate-in">
      <h2>Network Images</h2>
      <p className="section-desc">
        Fetch and process images from allowed external hosts. The server
        validates hosts against a whitelist for security.
      </p>

      <div className="demo-card wide">
        <h3>✅ Allowed Hosts</h3>
        <p className="card-desc">
          Images from these domains are fetched, processed, and cached by the
          server:
        </p>
        <div className="allowed-hosts">
          <span className="host-badge">picsum.photos</span>
          <span className="host-badge">images.unsplash.com</span>
          <span className="host-badge">placekitten.com</span>
          <span className="host-badge">via.placeholder.com</span>
        </div>
      </div>

      <div className="network-grid" style={{ marginTop: "1.5rem" }}>
        {networkImages.map((img, index) => (
          <div key={img.src} className="network-card">
            <div className="image-container">
              <Pixel
                src={img.src}
                alt={img.title}
                width={400}
                height={300}
                backendUrl={API_URL}
              />
            </div>
            <div className="network-card-info">
              <strong>{img.title}</strong>
              <span className="host-tag">{img.host}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="demo-card wide" style={{ marginTop: "1.5rem" }}>
        <h3>🔄 Processing Pipeline</h3>
        <div className="pipeline-demo">
          <div className="pipeline-step">
            <span className="pipeline-icon">🌐</span>
            <span className="pipeline-label">External URL</span>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-step">
            <span className="pipeline-icon">🔒</span>
            <span className="pipeline-label">Host Validation</span>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-step">
            <span className="pipeline-icon">⬇️</span>
            <span className="pipeline-label">Download</span>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-step">
            <span className="pipeline-icon">🔧</span>
            <span className="pipeline-label">Process</span>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-step">
            <span className="pipeline-icon">📤</span>
            <span className="pipeline-label">Serve</span>
          </div>
        </div>
      </div>

      <div className="info-box" style={{ marginTop: "1.5rem" }}>
        <span className="info-icon">🔒</span>
        <div>
          <strong>Security:</strong> Only images from hosts in{" "}
          <code>allowedNetworkList</code> are fetched. Disallowed hosts return a
          fallback image automatically.
        </div>
      </div>
    </section>
  );
}

function GallerySection() {
  return (
    <section className="section animate-in">
      <h2>Image Gallery</h2>
      <p className="section-desc">
        A responsive gallery showcasing real-world image loading patterns with
        lazy loading and format optimization.
      </p>

      <div className="gallery-grid">
        {GALLERY_IMAGES.map((img, index) => (
          <div
            key={index}
            className="gallery-item"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <Pixel
              src={img.src}
              alt={img.title}
              width={400}
              height={280}
              backendUrl={API_URL}
              lazy
              style={{ borderRadius: "8px" }}
            />
            <div className="gallery-overlay">
              <span>{img.title}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="demo-card wide" style={{ marginTop: "2rem" }}>
        <h3>📱 Masonry Layout</h3>
        <p className="card-desc">
          Mixed aspect ratios in a masonry-style grid:
        </p>
        <div className="masonry-grid">
          <div className="masonry-item tall">
            <Pixel
              src="https://picsum.photos/seed/masonry1/400/600"
              alt="Tall image"
              width={400}
              height={600}
              backendUrl={API_URL}
            />
          </div>
          <div className="masonry-item">
            <Pixel
              src="https://picsum.photos/seed/masonry2/400/300"
              alt="Standard image"
              width={400}
              height={300}
              backendUrl={API_URL}
            />
          </div>
          <div className="masonry-item">
            <Pixel
              src="https://picsum.photos/seed/masonry3/400/300"
              alt="Standard image"
              width={400}
              height={300}
              backendUrl={API_URL}
            />
          </div>
          <div className="masonry-item wide">
            <Pixel
              src="https://picsum.photos/seed/masonry4/800/300"
              alt="Wide image"
              width={800}
              height={300}
              backendUrl={API_URL}
            />
          </div>
          <div className="masonry-item">
            <Pixel
              src="https://picsum.photos/seed/masonry5/400/400"
              alt="Square image"
              width={400}
              height={400}
              backendUrl={API_URL}
            />
          </div>
          <div className="masonry-item tall">
            <Pixel
              src="https://picsum.photos/seed/masonry6/400/600"
              alt="Tall image"
              width={400}
              height={600}
              backendUrl={API_URL}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function HelpersSection() {
  const sampleUrl = buildPixelUrl({
    src: "/photos/landscape.jpg",
    width: 800,
    height: 600,
    quality: 90,
    format: "webp",
    backendUrl: API_URL,
  });

  const sampleSources = buildPixelSources({
    src: "/photos/landscape.jpg",
    width: 800,
    height: 600,
    avif: true,
    webp: true,
    mimeType: "jpeg",
    backendUrl: API_URL,
  });

  return (
    <section className="section animate-in">
      <h2>Helper Functions</h2>
      <p className="section-desc">
        Exported helper functions for custom implementations and advanced use
        cases.
      </p>

      <div className="helpers-grid">
        <div className="helper-card">
          <div className="helper-header">
            <span className="helper-icon">🔗</span>
            <h3>buildPixelUrl</h3>
          </div>
          <p className="card-desc">
            Generate a single URL for any image configuration:
          </p>
          <pre className="code">
            {`const url = buildPixelUrl({
  src: "/photos/landscape.jpg",
  width: 800,
  height: 600,
  quality: 90,
  format: "webp",
});`}
          </pre>
          <div className="result-box">
            <strong>Output:</strong>
            <code className="result-code">{sampleUrl}</code>
          </div>
        </div>

        <div className="helper-card">
          <div className="helper-header">
            <span className="helper-icon">📦</span>
            <h3>buildPixelSources</h3>
          </div>
          <p className="card-desc">
            Generate sources array for {"<picture>"} element:
          </p>
          <pre className="code">
            {`const sources = buildPixelSources({
  src: "/photos/landscape.jpg",
  avif: true,
  webp: true,
  mimeType: "jpeg",
});`}
          </pre>
          <div className="result-box">
            <strong>Output:</strong>
            <pre className="result-code" style={{ fontSize: "0.7rem" }}>
              {JSON.stringify(
                sampleSources.map((s) => ({ type: s.type, src: "..." })),
                null,
                2
              )}
            </pre>
          </div>
        </div>
      </div>

      <div className="demo-card wide" style={{ marginTop: "1.5rem" }}>
        <h3>🎯 Use Cases</h3>
        <div className="use-cases">
          <div className="use-case">
            <span className="use-case-icon">📧</span>
            <div>
              <strong>Email Templates</strong>
              <p>Generate static URLs for email campaigns</p>
            </div>
          </div>
          <div className="use-case">
            <span className="use-case-icon">🔄</span>
            <div>
              <strong>SSR/SSG</strong>
              <p>Pre-generate URLs during server rendering</p>
            </div>
          </div>
          <div className="use-case">
            <span className="use-case-icon">📱</span>
            <div>
              <strong>Native Apps</strong>
              <p>Use URLs in React Native or other platforms</p>
            </div>
          </div>
          <div className="use-case">
            <span className="use-case-icon">🎨</span>
            <div>
              <strong>Custom Components</strong>
              <p>Build your own image components</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ErrorsSection() {
  const errorScenarios = [
    {
      title: "🚫 Missing Image",
      desc: "File doesn't exist on server",
      src: "this-image-definitely-does-not-exist.jpg",
      type: "normal" as const,
    },
    {
      title: "👤 Missing Avatar",
      desc: "User avatar not found",
      src: "missing-user-avatar-12345.png",
      type: "avatar" as const,
    },
    {
      title: "🔒 Blocked Host",
      desc: "Domain not in allowlist",
      src: "https://malicious-site.com/image.jpg",
      type: "normal" as const,
    },
    {
      title: "⚠️ Path Traversal",
      desc: "Security attack blocked",
      src: "../../../etc/passwd",
      type: "normal" as const,
    },
    {
      title: "❌ Invalid Protocol",
      desc: "Non-HTTP protocol rejected",
      src: "ftp://files.example.com/image.jpg",
      type: "normal" as const,
    },
    {
      title: "🔗 Malformed URL",
      desc: "Invalid URL format",
      src: "http://[invalid-url",
      type: "normal" as const,
    },
  ];

  return (
    <section className="section animate-in">
      <h2>Error Handling</h2>
      <p className="section-desc">
        All error scenarios gracefully fall back to placeholder images. No
        broken images, no exposed errors, no security vulnerabilities.
      </p>

      <div className="error-grid">
        {errorScenarios.map((scenario) => (
          <div key={scenario.title} className="error-card">
            <div className="error-header">
              <h3>{scenario.title}</h3>
              <span className="error-desc">{scenario.desc}</span>
            </div>
            <div
              className={`image-container ${
                scenario.type === "avatar" ? "avatar-container" : ""
              }`}
            >
              <Pixel
                src={scenario.src}
                alt={scenario.title}
                type={scenario.type}
                width={scenario.type === "avatar" ? 120 : 280}
                height={scenario.type === "avatar" ? 120 : 180}
                backendUrl={API_URL}
                style={
                  scenario.type === "avatar" ? { borderRadius: "50%" } : {}
                }
              />
            </div>
            <code className="error-src">
              {scenario.src.length > 35
                ? scenario.src.slice(0, 35) + "..."
                : scenario.src}
            </code>
          </div>
        ))}
      </div>

      <div className="demo-card wide" style={{ marginTop: "1.5rem" }}>
        <h3>🛡️ Security Features</h3>
        <div className="security-features">
          <div className="security-item">
            <span className="security-icon">🚧</span>
            <div>
              <strong>Path Validation</strong>
              <p>Blocks directory traversal attacks (../, etc)</p>
            </div>
          </div>
          <div className="security-item">
            <span className="security-icon">🌐</span>
            <div>
              <strong>Host Allowlist</strong>
              <p>Only fetches from explicitly allowed domains</p>
            </div>
          </div>
          <div className="security-item">
            <span className="security-icon">📝</span>
            <div>
              <strong>MIME Validation</strong>
              <p>Verifies content-type of remote images</p>
            </div>
          </div>
          <div className="security-item">
            <span className="security-icon">⏱️</span>
            <div>
              <strong>Request Limits</strong>
              <p>Timeout and size limits prevent abuse</p>
            </div>
          </div>
        </div>
      </div>

      <div className="info-box success" style={{ marginTop: "1.5rem" }}>
        <span className="info-icon">✅</span>
        <div>
          <strong>Zero Information Leakage:</strong> Error responses never
          expose system paths, stack traces, or internal details. All failures
          return safe, user-friendly fallback images.
        </div>
      </div>
    </section>
  );
}

export default App;
