/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" }
    ]
  },
  // three.js ships untranspiled ESM in a few sub-paths; transpile to be safe.
  transpilePackages: ["three"]
};

export default nextConfig;
