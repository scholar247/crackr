import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The SQL playground forks sql-runner.cjs and reads the .sql templates from disk at
  // runtime, which file tracing can't see — ship them (and better-sqlite3) with its routes.
  outputFileTracingIncludes: {
    '/api/v1/sql-playground/*': [
      './src/server/services/sql-playground/**/*.{cjs,sql}',
      './node_modules/better-sqlite3/**/*',
      './node_modules/bindings/**/*',
      './node_modules/file-uri-to-path/**/*',
    ],
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
