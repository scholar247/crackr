import type { Metadata } from 'next';
import { Geist, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { cn } from '@/lib/utils';
import Script from 'next/script';
import { GoogleAnalytics } from '@next/third-parties/google';

const isProd = process.env.NODE_ENV === 'production';
const gaId = process.env.NEXT_PUBLIC_GA_ID;
const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

const BASE_URL = 'https://scholar247.org';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Scholar247 — Learn, Practice, Progress, Crack',
    template: '%s | scholar247',
  },
  description:
    'scholar247 is an EdTech platform for practising MCQs, taking mock tests, and tracking your exam preparation progress.',
  keywords: ['MCQ', 'practice', 'exam preparation', 'mock test', 'EdTech'],
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  openGraph: {
    siteName: 'scholar247',
    type: 'website',
    url: BASE_URL,
    images: [{ url: '/logo.svg', width: 512, height: 512, alt: 'scholar247' }],
  },
  twitter: {
    card: 'summary',
    site: '@scholar247',
    images: ['/logo.svg'],
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {adsenseClientId && <meta name="google-adsense-account" content={adsenseClientId} />}
      </head>
      <body className={cn(geist.variable, jetbrainsMono.variable, 'font-sans antialiased bg-background text-foreground')}>
        <Providers>{children}</Providers>
        {isProd && adsenseClientId && (
          <Script
            id="adsbygoogle-init"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </body>
      {isProd && gaId && <GoogleAnalytics gaId={gaId} />}
    </html>
  );
}
