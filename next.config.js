/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next 16 blocks cross-origin requests for dev resources; Playwright opens the dev server
  // at 127.0.0.1 while it reports itself as localhost.
  allowedDevOrigins: ["127.0.0.1"],
  // Optional: reduce image optimization issues if no remote images yet
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
