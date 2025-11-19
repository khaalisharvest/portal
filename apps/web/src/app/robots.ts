import { MetadataRoute } from 'next';
import { APP_URL } from '@/config/env';

export default function robots(): MetadataRoute.Robots {
  // Use DuckDNS domain for robots.txt
  const baseUrl = 'https://khaalisharvest.duckdns.org';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/super-admin/', '/auth/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

