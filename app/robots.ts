import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = 'https://courageous-cuchufli-0ede60.netlify.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/cart', '/checkout', '/wishlist'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}