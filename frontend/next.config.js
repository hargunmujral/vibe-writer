/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false, // Disable SWC minification in favor of Babel
  experimental: {
    externalDir: true,
  },
  webpack: (config) => {
    // Add any custom webpack configuration here if needed
    return config;
  },
}

module.exports = nextConfig 