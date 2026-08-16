import { MetadataRoute } from 'next';
import { COMPARISONS } from '@/config/comparisons';
import { listPublicRoastIds } from '@/actions/roasts';
import { SITE } from '@/config/site';

const baseUrl = SITE.url;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/roast`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.95 },
    { url: `${baseUrl}/ideas`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/vs`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/founder`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    ...COMPARISONS.map(item => ({
      url: `${baseUrl}/vs/${item.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),
    { url: `${baseUrl}/auth/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/auth/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  let publicRoasts: Awaited<ReturnType<typeof listPublicRoastIds>> = [];
  try {
    publicRoasts = await listPublicRoastIds();
  } catch {
    publicRoasts = [];
  }
  const roastPages: MetadataRoute.Sitemap = publicRoasts.map(item => ({
    url: `${baseUrl}/r/${item.id}`,
    lastModified: item.updatedAt,
    changeFrequency: 'yearly',
    priority: 0.5,
  }));

  return [...staticPages, ...roastPages];
}
