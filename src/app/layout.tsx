import type { Metadata } from 'next';
import '../styles/globals.scss';

export const metadata: Metadata = {
  title: 'LegalErrand — The study tool your lecturer never gave you',
  description:
    'AI-native study platform for Nigerian law undergraduates. Break down court cases, simplify legal concepts, and prepare for your exams.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
