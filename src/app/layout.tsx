import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://khaalisharvest.com';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f2318',
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: 'Khaalis Harvest — Something Pure is Coming to Lahore',
  description: "Lahore's first truly organic marketplace. Pure food, honest sourcing, delivered fresh. Coming soon.",
  keywords: 'organic food Lahore, pure organic products Pakistan, khaalis harvest, خالص',
  authors: [{ name: 'Khaalis Harvest' }],
  icons: {
    icon: '/images/favicon-512x512.png',
    apple: '/images/favicon-512x512.png',
  },
  openGraph: {
    title: 'Khaalis Harvest — Something Pure is Coming',
    description: "Lahore's first truly organic marketplace. Coming soon.",
    type: 'website',
    siteName: 'Khaalis Harvest',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap"
        />
      </head>
      <body className={`${poppins.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
