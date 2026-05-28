import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { TopNavbar } from '@/components/layout/top-navbar';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'crackr — Learn, Practice, Progress, Crack',
    template: '%s | crackr',
  },
  description:
    'crackr is an EdTech platform for practising MCQs, taking mock tests, and tracking your exam preparation progress. Built for JEE, NEET, UPSC, and more.',
  keywords: ['MCQ', 'practice', 'exam preparation', 'mock test', 'JEE', 'NEET', 'UPSC', 'EdTech'],
  openGraph: {
    siteName: 'crackr',
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
      <body
        className={cn(
          inter.variable,
          'font-sans antialiased bg-background text-foreground'
        )}
      >
        <Providers>
          <TopNavbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
