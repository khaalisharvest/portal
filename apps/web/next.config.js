/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Note: We use dynamic = 'force-dynamic' in layout.tsx instead of output: 'standalone'
  // This allows dynamic rendering while maintaining compatibility
  // Memory optimization
  experimental: {
    memoryBasedWorkersCount: true,
  },
  // Reduce memory usage
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  // NEXT_PUBLIC_* vars are automatically embedded in the client bundle at build time
  // Server-side vars (BACKEND_URL, JWT_SECRET) are read directly via process.env in API routes
  // No env config needed here — all vars are either NEXT_PUBLIC_* or pure server-side
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
