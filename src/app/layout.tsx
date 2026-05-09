import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import NextTopLoader from 'nextjs-toploader';
import ErrorBoundary from '@/components/ErrorBoundary';
import '../styles/globals.scss';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://legalerrand.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'LegalErrand — The study tool your lecturer never gave you',
  description:
    'AI-native study platform for Nigerian law undergraduates. Break down court cases, simplify legal concepts, and prepare for your exams.',
  openGraph: {
    title: 'LegalErrand — The study tool your lecturer never gave you',
    description:
      'AI-native study platform for Nigerian law undergraduates. Break down court cases, simplify legal concepts, and prepare for your exams.',
    url: siteUrl,
    siteName: 'LegalErrand',
    images: [{ url: '/social-share.png', width: 1200, height: 630, alt: 'LegalErrand' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LegalErrand — The study tool your lecturer never gave you',
    description:
      'AI-native study platform for Nigerian law undergraduates. Break down court cases, simplify legal concepts, and prepare for your exams.',
    images: ['/social-share.png'],
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <NextTopLoader color="#D97706" showSpinner={false} />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
