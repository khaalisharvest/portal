import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Khaalis Harvest — Something Pure is Coming to Lahore',
  description:
    "We got tired of buying 'organic' that isn't really organic. Khaalis Harvest is Lahore's first truly organic marketplace — pure food, honest sourcing, delivered fresh. Coming soon.",
  keywords:
    'organic food Lahore, pure organic products Pakistan, fresh vegetables Lahore, organic dairy Pakistan, khaalis harvest, خالص, organic marketplace Pakistan',
  openGraph: {
    title: 'Khaalis Harvest — Something Pure is Coming',
    description:
      "Lahore's first truly organic marketplace. No chemicals. No shortcuts. No compromises. Coming soon.",
    url: 'https://www.khaalisharvest.com',
    siteName: 'Khaalis Harvest',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Khaalis Harvest — Pure Organic Coming to Lahore',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Khaalis Harvest — Something Pure is Coming',
    description: "Lahore's first truly organic marketplace. Coming soon.",
    images: ['/images/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://www.khaalisharvest.com',
  },
};

export default function ComingSoonPage() {
  const whatsappUrl =
    'https://wa.me/923215998981?text=I%20want%20to%20be%20notified%20when%20Khaalis%20Harvest%20launches!';

  return (
    <main className="min-h-screen bg-[#0f2318] text-[#f5f0e8] flex flex-col">

      {/* Dot-grid texture */}
      <div
        className="fixed inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #f5f0e8 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Main content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-16 text-center max-w-2xl mx-auto w-full">

        {/* Logo */}
        <div className="mb-10">
          <Image
            src="/images/logo.png"
            alt="Khaalis Harvest"
            width={160}
            height={60}
            className="mx-auto brightness-0 invert opacity-90"
            priority
          />
        </div>

        {/* Urdu */}
        <p
          className="text-[#4B8B3B] text-2xl mb-6 leading-relaxed"
          style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}
          dir="rtl"
        >
          خالص
        </p>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl font-bold text-[#f5f0e8] leading-tight mb-6 tracking-tight">
          Something Pure<br />is Coming
        </h1>

        {/* Subheading */}
        <p className="text-[#8B5E3C] text-lg font-medium mb-10">
          Lahore&apos;s first truly organic marketplace —<br className="hidden sm:block" />
          because your family deserves better than what&apos;s on the shelves today.
        </p>

        <div className="w-12 h-px bg-[#4B8B3B] mb-10 opacity-60" />

        {/* Brand story */}
        <div className="text-[#c8c0b0] text-base sm:text-lg leading-relaxed space-y-5 text-left">
          <p>Honestly? We got tired of it.</p>
          <p>
            Tired of buying &ldquo;organic&rdquo; that isn&apos;t really organic. Tired of not
            knowing where our food comes from, who grew it, or what was sprayed on it.
            Tired of feeding our kids something we weren&apos;t sure about.
          </p>
          <p>So we decided to do something about it.</p>
          <p>
            Khaalis Harvest started with a simple idea — go find the farmers who
            actually care, the ones growing food the old way, the honest way, and
            bring their harvest directly to Lahore families like yours.
          </p>
          <p>
            No middlemen inflating prices. No cold storage killing nutrition.
            No labels that lie.
          </p>
          <p className="text-[#f5f0e8] font-medium">
            Just real food. Grown clean. Delivered fresh.
          </p>
          <p>
            We are almost ready. And when we open our doors, we want you to be
            first through them.
          </p>
        </div>

        {/* CTAs */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 w-full sm:justify-center">
          <Link
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 bg-[#25D366] text-white font-semibold text-base px-8 py-4 rounded-xl hover:bg-[#1ebe5d] transition-colors duration-200 shadow-lg"
          >
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Notify me on WhatsApp
          </Link>

          <Link
            href="mailto:info@khaalisharvest.com?subject=Notify%20me%20when%20you%20launch&body=Hi%20Khaalis%20Harvest%2C%20please%20notify%20me%20when%20you%20launch!"
            className="inline-flex items-center justify-center gap-3 bg-transparent border border-[#4B8B3B] text-[#f5f0e8] font-semibold text-base px-8 py-4 rounded-xl hover:bg-[#4B8B3B]/10 transition-colors duration-200"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Send us an email
          </Link>
        </div>

        <p className="mt-8 text-[#6b6358] text-sm">
          Or call us:{' '}
          <Link href="tel:+923215998981" className="text-[#8B5E3C] hover:text-[#f5f0e8] transition-colors">
            0321 5998981
          </Link>
        </p>
      </div>

      {/* Footer */}
      <footer className="relative border-t border-white/5 py-8 px-6">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[#6b6358] text-sm">
          <p>© 2026 Khaalis Harvest · Lahore, Pakistan</p>
          <Link href="mailto:info@khaalisharvest.com" className="hover:text-[#f5f0e8] transition-colors">
            info@khaalisharvest.com
          </Link>
        </div>
      </footer>

    </main>
  );
}
