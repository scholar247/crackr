import type { NextConfig } from 'next';

// Short CBSE URLs (/exam/cbse-class-10/…) → the canonical exam pages under /exams/{slug}.
// Permanent, so links shared with the short form consolidate onto one indexed URL.
const CBSE_SHORT_URLS = [
  { short: 'cbse-class-10', slug: 'cbse-class-10-board' },
  { short: 'cbse-class-12', slug: 'cbse-class-12-board' },
];

const nextConfig: NextConfig = {
  async redirects() {
    return CBSE_SHORT_URLS.flatMap(({ short, slug }) => [
      // Renamed sections first, then everything else maps 1:1.
      { source: `/exam/${short}/mocktest`, destination: `/exams/${slug}/mock-tests`, permanent: true },
      { source: `/exam/${short}/sample-paper`, destination: `/exams/${slug}/sample-papers`, permanent: true },
      { source: `/exam/${short}/sample-paper/:path*`, destination: `/exams/${slug}/sample-papers/:path*`, permanent: true },
      { source: `/exam/${short}/:path*`, destination: `/exams/${slug}/:path*`, permanent: true },
      // Common variants of the canonical paths.
      { source: `/exams/${slug}/mocktest`, destination: `/exams/${slug}/mock-tests`, permanent: true },
      { source: `/exams/${slug}/sample-paper`, destination: `/exams/${slug}/sample-papers`, permanent: true },
    ]);
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      // Allow any HTTPS image URL (course thumbnails, banners from CDNs/editors)
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
};

export default nextConfig;
