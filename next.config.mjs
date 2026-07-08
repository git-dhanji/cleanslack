/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        // Privacy + safety headers for the whole app.
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          // Never leak the URL (which may carry a connection code) to third parties.
          { key: "Referrer-Policy", value: "no-referrer" },
          // Voice/video calls need mic & camera from OUR OWN origin. An empty
          // allowlist `microphone=()` would block getUserMedia everywhere,
          // including this site — so scope it to `self`, deny all others.
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(self), camera=(self), display-capture=(self)",
          },
        ],
      },
      {
        // The signaling endpoint must never be cached or stored anywhere.
        source: "/api/signal",
        headers: [{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate" }],
      },
    ]
  },
}

export default nextConfig
