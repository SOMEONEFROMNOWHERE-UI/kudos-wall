import type { Metadata, Viewport } from 'next';
import './globals.css';
import { KudosProvider } from '@/context/KudosContext';

export const metadata: Metadata = {
  title: 'Kudos Wall — Team Recognition That Matters',
  description:
    'Give meaningful recognition to your teammates. A beautiful, real-time kudos wall where appreciation comes alive.',
  keywords: ['kudos', 'team', 'recognition', 'appreciation', 'wall', 'workplace'],
  openGraph: {
    title: 'Kudos Wall — Team Recognition That Matters',
    description: 'Give meaningful recognition to your teammates.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#050510',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <KudosProvider>{children}</KudosProvider>
      </body>
    </html>
  );
}
