/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optional: reduce image optimization issues if no remote images yet
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
