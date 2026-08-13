import { MetadataRoute } from 'next';
import { APP_URL } from '@/config/env';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://khaalisharvest.com';

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

