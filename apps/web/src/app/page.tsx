'use client';

import Image from 'next/image';
import Link from 'next/link';
import Hero from '@/components/sections/Hero';
import ProductsSection from '@/components/sections/ProductsSection';
import OrganicPattern from '@/components/ui/OrganicPattern';

export default function HomePage() {
  return (
    <>
      {/* ── Hero + Products ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-neutral-50">

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
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/85 to-neutral-50" />
        </div>

        <div className="relative">
          <Hero />
        </div>

        <div className="relative container-custom pb-12">
          <ProductsSection showOnly={8} />

          {/* ── View All CTA strip ───────────────────────────────────────────── */}
          <div className="relative mt-10 rounded-2xl overflow-hidden">
            <OrganicPattern />
            {/* green-tinted overlay so icons recede and text pops */}
            <div className="absolute inset-0 bg-primary-800/80" />
            <div className="relative z-10 py-10 px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-white font-semibold text-lg leading-snug">
                  Explore our full range of organic products
                </p>
                <p className="text-primary-200 text-sm mt-1">
                  Freshly sourced · 100% pure · Delivered to your door
                </p>
              </div>
              <Link
                href="/products"
                className="flex-shrink-0 inline-flex items-center gap-2 bg-white text-primary-700 font-semibold text-sm px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors duration-200 shadow-sm"
              >
                View All Products
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
