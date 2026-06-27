/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" }
    ]
  },
  webpack: (config) => {
    // pdf.js references an optional native `canvas` package that isn't used in
    // the browser build — stub it so webpack doesn't try to bundle it.
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false
    };
    return config;
  }
};

export default nextConfig;
