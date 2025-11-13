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
  // Environment variables - NO FALLBACKS
  // Docker provides all env vars during build via ARG/ENV in Dockerfile
  // Next.js automatically exposes NEXT_PUBLIC_* vars to client-side at build time
  // Only explicitly set non-NEXT_PUBLIC vars and computed values
  env: {
    // Computed values - read directly from .env (provided by Docker during build)
    API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL,
    // Server-side only vars - read directly from .env (provided by Docker during build)
    BACKEND_URL: process.env.BACKEND_URL,
    JWT_SECRET: process.env.JWT_SECRET,
  },
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
