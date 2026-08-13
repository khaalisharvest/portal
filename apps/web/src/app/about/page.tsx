'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { APP_NAME } from '@/config/env';
import { usePublicSettings } from '@/hooks/usePublicSettings';

interface Category {
  id: string;
  name: string;
  description?: string;
}

const pillars = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    title: 'Pure Sourcing',
    description: 'We source directly from trusted farmers and suppliers across Punjab, carefully selecting products free from synthetic additives, artificial colours, and unnecessary preservatives.',
    color: 'primary',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
    title: 'Trusted Quality',
    description: 'Every product in our range is hand-checked before packing. We maintain strict hygiene standards at every step, from sourcing to your doorstep — in compliance with Punjab Food Authority guidelines.',
    color: 'secondary',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    title: 'Delivered Fresh',
    description: 'We pack and dispatch quickly to preserve freshness. From our hands to your kitchen — pure, natural food the way it was meant to be.',
    color: 'earth',
  },
];

const stats = [
  { value: '100%', label: 'Pure Products' },
  { value: 'PFA', label: 'Compliant Business' },
  { value: '24h', label: 'Support Response' },
  { value: 'PKR', label: 'Local Pricing' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' } }),
};

export default function AboutPage() {
  const appName = APP_NAME || 'Khaalis Harvest';
  const { settings } = usePublicSettings();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch('/api/v1/products/categories')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setCategories(data.data ?? data); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative h-[480px] sm:h-[560px] overflow-hidden">
        <Image
          src="/images/about-us.png"
          alt="Fresh organic products from Khaalis Harvest"
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Dark + green gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 via-neutral-900/40 to-primary-900/30" />

        {/* Floating content */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-14 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-white/80 text-xs font-medium mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
              Pakistan's Pure Organic Marketplace
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
              About{' '}
              <span className="text-primary-400">{appName}</span>
            </h1>
            <p className="text-white/80 text-lg sm:text-xl max-w-2xl leading-relaxed">
              Bringing Pakistan's purest organic products from farm to your family table.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Stats strip ───────────────────────────────────────────────────── */}
      <div className="bg-primary-700 text-white">
        <div className="container-custom py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {stats.map((s) => (
              <div key={s.label} className="py-2">
                <p className="text-2xl sm:text-3xl font-bold text-white">{s.value}</p>
                <p className="text-primary-200 text-xs font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Our Story ─────────────────────────────────────────────────────── */}
      <section className="container-custom py-16">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            variants={fadeUp}
          >
            <span className="inline-block text-xs font-semibold text-primary-600 uppercase tracking-widest mb-3">Our Story</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-6 leading-tight">
              Why We Started{' '}
              <span className="text-primary-600">{appName}</span>
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
            variants={fadeUp}
            className="space-y-4 text-neutral-600 leading-relaxed"
          >
            <p>
              Pakistan's food markets are full of products that look clean on the outside but contain
              artificial colours, synthetic additives, and adulterated ingredients on the inside.
              Finding genuinely pure food — chawal without mixing, atta without added chalk, spices
              without artificial dye — had become a challenge even in our own homes.
            </p>
            <p>
              <strong className="text-neutral-800">{appName}</strong> was created to solve that.
              We source directly from trusted suppliers, hand-check every batch, pack with care,
              and deliver to your door. No shortcuts. No hidden ingredients.
              Just food the way nature intended — <em>khaalis</em>.
            </p>
            <p>
              We started with the basics — rice, flour, and everyday spices — because that's where
              Pakistani families spend the most and trust the least. Our mission is to expand from
              there, building a marketplace where purity isn't a premium feature; it's the standard.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Three Pillars ─────────────────────────────────────────────────── */}
      <section className="bg-white border-y border-neutral-100 py-16">
        <div className="container-custom">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-semibold text-primary-600 uppercase tracking-widest mb-3">What We Stand For</span>
            <h2 className="text-3xl font-bold text-neutral-900">Our Three Commitments</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {pillars.map((p, i) => (
              <motion.div
                key={p.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="group relative bg-neutral-50 hover:bg-white rounded-2xl p-7 border border-neutral-100 hover:border-primary-200 hover:shadow-md transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors
                  ${p.color === 'primary' ? 'bg-primary-100 text-primary-600 group-hover:bg-primary-200' :
                    p.color === 'secondary' ? 'bg-secondary-100 text-secondary-600 group-hover:bg-secondary-200' :
                    'bg-earth-100 text-earth-600 group-hover:bg-earth-200'}`}>
                  {p.icon}
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">{p.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{p.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What We Sell ──────────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="container-custom py-16">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <span className="inline-block text-xs font-semibold text-primary-600 uppercase tracking-widest mb-3">Our Range</span>
              <h2 className="text-3xl font-bold text-neutral-900 mb-3">What We Offer</h2>
              <p className="text-neutral-500 text-sm">Pure, naturally sourced products delivered to your door.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i}
                  variants={fadeUp}
                  className="flex items-start gap-4 bg-white rounded-xl p-4 border border-neutral-100 shadow-xs hover:border-primary-200 hover:shadow-sm transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-800 text-sm">{cat.name}</p>
                    {cat.description && (
                      <p className="text-neutral-500 text-xs mt-0.5 leading-relaxed">{cat.description}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link href="/products"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                Browse all products
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="container-custom pb-16">
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500" />
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10S0 14.5 0 20s4.5 10 10 10 10-4.5 10-10zm0 0c0 5.5 4.5 10 10 10s10-4.5 10-10-4.5-10-10-10-10 4.5-10 10z'/%3E%3C/g%3E%3C/svg%3E\")" }} />
          <div className="relative py-14 px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Ready to experience pure food?</h2>
            <p className="text-primary-200 mb-8 max-w-md mx-auto">
              Browse our full range of naturally sourced products and taste the difference purity makes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/products"
                className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 font-semibold px-7 py-3.5 rounded-xl hover:bg-primary-50 transition-colors shadow-md">
                Shop Now
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              {settings.admin_whatsapp && (
                <a
                  href={`https://wa.me/${settings.admin_whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-white/20 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  Chat on WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
