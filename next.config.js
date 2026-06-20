/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdfkit', '@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner', 'sharp'],
  typescript: {
    // Local iteration: SKIP_TYPECHECK=1 npm run build  (use npm run typecheck separately)
    ignoreBuildErrors: process.env.SKIP_TYPECHECK === '1',
  },
  experimental: {
    optimizePackageImports: ['framer-motion', '@phosphor-icons/react'],
  },
  // Enable gzip/brotli compression for smaller response sizes
  compress: true,
  // Optimize production builds
  poweredByHeader: false,
  // Cache static assets aggressively
  headers: async () => [
    {
      // Cache static assets (JS, CSS, fonts) for 1 year
      source: '/_next/static/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      // Cache images for 1 day, revalidate in background
      source: '/uploads/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
      ],
    },
    {
      // Public API responses: short cache for listing data
      source: '/api/imei/services/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' },
      ],
    },
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: 'pub-968db0ba07b94d5991bc500bdf723803.r2.dev',
      },
    ],
  },
}

module.exports = nextConfig
