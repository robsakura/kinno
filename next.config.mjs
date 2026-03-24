/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  images: {
    remotePatterns: [
      { hostname: "image.tmdb.org" },
      { hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
