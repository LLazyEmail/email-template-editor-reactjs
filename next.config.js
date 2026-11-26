/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-contained server in .next/standalone for the Docker image (see Dockerfile).
  output: "standalone",
  // Next 16 blocks cross-origin requests for dev resources; Playwright opens the dev server
  // at 127.0.0.1 while it reports itself as localhost.
  allowedDevOrigins: ["127.0.0.1"],
  // The default bottom-left spot covers the sidebar collapse trigger.
  devIndicators: { position: "bottom-right" },
  // Optional: reduce image optimization issues if no remote images yet
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
