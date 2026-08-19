import type { Metadata } from 'next';
import { Geist, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { cn } from '@/lib/utils';
import Script from 'next/script';
import { GoogleAnalytics } from '@next/third-parties/google';
import { SITE_NAME, SITE_URL, SITE_TWITTER_HANDLE } from '@/lib/site-config';

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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Learn, Practice, Progress, Crack`,
    template: `%s | ${SITE_NAME}`,
  },
  description: `${SITE_NAME} is an EdTech platform for practising MCQs, taking mock tests, and tracking your exam preparation progress.`,
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
    siteName: SITE_NAME,
    type: 'website',
    url: SITE_URL,
    images: [{ url: '/logo.svg', width: 512, height: 512, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary',
    site: SITE_TWITTER_HANDLE,
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
