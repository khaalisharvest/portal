'use client';

import Image from 'next/image';
import Link from 'next/link';
import Hero from '@/components/sections/Hero';
import ProductsSection from '@/components/sections/ProductsSection';
import HowItWorks from '@/components/sections/HowItWorks';
import CTA from '@/components/sections/CTA';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-50">

      {/* ── Hero + Products — shared background ─────────────────── */}
      <section className="relative overflow-hidden">

        {/* Shared background image */}
        <div className="absolute inset-0">
          <Image
            src="/images/products-section.png"
            alt=""
            fill
            priority
            quality={88}
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Gradient overlay — dense at top so hero text is crisp, lighter below so food warmth glows through product cards */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/88 to-white/78" />
        </div>

        {/* Hero text strip */}
        <div className="relative">
          <Hero />
        </div>

        {/* Products — same background, no gap */}
        <div className="relative container-custom pb-12">
          <ProductsSection showOnly={8} />
          <div className="text-center mt-8">
            <Link href="/products" className="btn-primary inline-flex items-center gap-2">
              View All Products
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Bottom fade into HowItWorks */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-neutral-50 to-transparent pointer-events-none" />
      </section>

      <HowItWorks />
      <CTA />

    </main>
  );
}
