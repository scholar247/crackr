import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://scholar247.org';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/onboarding', '/dashboard', '/settings', '/sign-in'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
