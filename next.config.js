/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
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
    {
      // Security headers
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
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
