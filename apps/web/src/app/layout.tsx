import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import ConditionalHeader from '@/components/layout/ConditionalHeader';
import ConditionalFooter from '@/components/layout/ConditionalFooter';
import { APP_URL } from '@/config/env';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#4B8B3B',
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: 'Khaalis Harvest - Pure Organic Products',
  description: 'Pakistan\'s premier organic marketplace. Pure, unadulterated products delivered to your door. The Pure Embrace of nature.',
  keywords: 'khaalis harvest, organic, pure, fresh products, vegetables, plants, milk, Pakistan, natural products, authentic, unadulterated',
  authors: [{ name: 'Khaalis Harvest Team' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/images/favicon-512x512.png',
    apple: '/images/favicon-512x512.png',
    shortcut: '/images/favicon-512x512.png',
  },
  openGraph: {
    title: 'Khaalis Harvest - Pure Organic Products',
    description: 'Pakistan\'s premier organic marketplace. Pure, unadulterated products delivered to your door. The Pure Embrace of nature.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Khaalis Harvest',
    images: [
      {
        url: '/images/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Khaalis Harvest - Pure Organic Products',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Khaalis Harvest - Pure Organic Products',
    description: 'Pakistan\'s premier organic marketplace. Pure, unadulterated products delivered to your door. The Pure Embrace of nature.',
    images: ['/images/og-image.svg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="icon" href="/images/favicon-512x512.png" />
        <link rel="shortcut icon" href="/images/favicon-512x512.png" />
        <link rel="apple-touch-icon" href="/images/favicon-512x512.png" />
      </head>
      <body className={`${inter.className} organic-gradient`}>
        <Providers>
          <ConditionalHeader />
          <main className="min-h-screen">
            {children}
          </main>
          <ConditionalFooter />
        </Providers>
      </body>
    </html>
  );
}
