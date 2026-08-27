/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
      allowedOrigins: ['veda-ai-eagu.onrender.com', 'localhost:3000'],
    },
  },
  serverExternalPackages: ['pdf-parse'],
}

export default nextConfig
