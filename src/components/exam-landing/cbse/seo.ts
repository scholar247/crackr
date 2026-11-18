import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/lib/site-config';

// Metadata and JSON-LD for the CBSE board pages. Titles lead with the phrase students
// search ("CBSE Class 10 syllabus 2026–27"), and each page's description says what is on
// that page specifically, so no two pages compete for the same query.

const OG_IMAGE = { url: '/logo.svg', width: 512, height: 512, alt: SITE_NAME };

export function cbseMeta(
  path: string,
  title: string,
  description: string,
  opts: { noindex?: boolean; type?: 'website' | 'article'; image?: { url: string; alt: string } } = {},
): Metadata {
  // A page-specific 1200×630 image gets the large preview card; otherwise the shared logo.
  const image = opts.image ? { url: opts.image.url, width: 1200, height: 630, alt: opts.image.alt } : null;
  return {
    title,
    description,
    alternates: { canonical: path },
    // openGraph replaces the root layout's object wholesale, so repeat the shared image.
    openGraph: { title, description, url: path, type: opts.type ?? 'website', siteName: SITE_NAME, images: [image ?? OG_IMAGE] },
    twitter: image ? { card: 'summary_large_image', title, description, images: [image.url] } : { card: 'summary', title, description },
    ...(opts.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

export const absoluteUrl = (path: string) => new URL(path, SITE_URL).toString();

export const ORGANIZATION = { '@type': 'Organization', name: SITE_NAME, url: SITE_URL, logo: absoluteUrl('/logo.svg') } as const;

/** CollectionPage for a hub or list page; `items` become its ItemList in page order. */
export function collectionPageJsonLd({ path, name, description, items }: { path: string; name: string; description: string; items: { name: string; path: string }[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: absoluteUrl(path),
    inLanguage: 'en-IN',
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
    publisher: ORGANIZATION,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, url: absoluteUrl(item.path) })),
    },
  };
}
