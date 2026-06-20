import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { TopNavbar } from '@/components/layout/top-navbar';
import { SiteFooter } from '@/components/layout/site-footer';
import { cn } from '@/lib/utils';
import Script from 'next/script';
import { GoogleAnalytics } from '@next/third-parties/google';

const isProd = process.env.NODE_ENV === 'production';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Scholar247 — Learn, Practice, Progress, Crack',
    template: '%s | scholar247',
  },
  description:
    'scholar247 is an EdTech platform for practising MCQs, taking mock tests, and tracking your exam preparation progress. Built for JEE, NEET, UPSC, and more.',
  keywords: ['MCQ', 'practice', 'exam preparation', 'mock test', 'JEE', 'NEET', 'UPSC', 'EdTech'],
  openGraph: {
    siteName: 'scholar247',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="google-adsense-account" content="ca-pub-2514997743854204" />
      </head>
      <body
        className={cn(
          inter.variable,
          'font-sans antialiased bg-background text-foreground'
        )}
      >
        <Providers>
          <TopNavbar />
          {children}
          <SiteFooter />
        </Providers>
        {isProd && (
          <Script
            id="adsbygoogle-init"
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2514997743854204"
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </body>
      {isProd && <GoogleAnalytics gaId="G-99J5BH9CHR" />}
    </html>
  );
}
