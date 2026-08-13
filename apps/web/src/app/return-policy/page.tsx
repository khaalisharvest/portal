'use client';

import Link from 'next/link';
import OrganicPattern from '@/components/ui/OrganicPattern';
import { usePublicSettings } from '@/hooks/usePublicSettings';
import { APP_NAME } from '@/config/env';

const LAST_UPDATED = 'August 10, 2026';

const sections = [
  { id: 'overview',     title: 'Overview' },
  { id: 'eligible',     title: 'What Can Be Returned' },
  { id: 'ineligible',   title: 'What Cannot Be Returned' },
  { id: 'process',      title: 'How to Request a Return' },
  { id: 'refunds',      title: 'Refunds' },
  { id: 'damaged',      title: 'Damaged or Wrong Items' },
  { id: 'contact',      title: 'Contact Us' },
];

export default function ReturnPolicyPage() {
  const { settings } = usePublicSettings();
  const appName = APP_NAME || 'Khaalis Harvest';

  return (
    <div className="min-h-screen bg-neutral-50 relative">
      <OrganicPattern />

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-earth-700 via-earth-600 to-earth-500 overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='1'%3E%3Ccircle cx='10' cy='10' r='3'/%3E%3Ccircle cx='50' cy='50' r='3'/%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative container-custom py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-earth-100 text-xs font-medium mb-5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Legal Document
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">Return & Refund Policy</h1>
          <p className="text-earth-200 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      <div className="relative container-custom py-12">
        <div className="lg:grid lg:grid-cols-4 lg:gap-10 items-start">

          {/* Sidebar TOC */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-6 bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">Contents</p>
              <nav className="space-y-0.5">
                {sections.map((s, i) => (
                  <a key={s.id} href={`#${s.id}`}
                    className="flex items-center gap-2.5 text-sm text-neutral-600 hover:text-primary-600 py-1.5 px-2 rounded-lg hover:bg-primary-50 transition-colors group">
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-earth-100 text-earth-700 text-[10px] font-bold flex-shrink-0 group-hover:bg-primary-100 group-hover:text-primary-700 transition-colors">
                      {i + 1}
                    </span>
                    {s.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className="lg:col-span-3 space-y-5 mt-6 lg:mt-0">

            {/* Intro */}
            <div className="bg-secondary-50 border border-secondary-100 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-neutral-700 leading-relaxed text-sm">
                  Because we sell <strong>fresh and organic food products</strong>, our return policy is shaped by
                  the perishable nature of food. We are committed to delivering quality — if something isn't right,
                  we will always work to make it right.
                </p>
              </div>
            </div>

            <ReturnSection id="overview" number={1} title="Overview">
              <p>
                We want every {appName} customer to be fully satisfied. Our return and refund policy
                covers situations where products arrive damaged, incorrect, or significantly below described quality.
                Due to food safety and hygiene regulations under the Punjab Food Authority (PFA),
                we cannot accept returns of consumable food items once delivered and accepted in good condition.
              </p>
              <p>
                All return requests must be raised <strong>within 24 hours</strong> of delivery via WhatsApp with
                photo evidence. Requests raised after 24 hours may not be accepted.
              </p>
            </ReturnSection>

            <ReturnSection id="eligible" number={2} title="What Can Be Returned / Refunded">
              <p>You are eligible for a return or refund if:</p>
              <ul>
                <li>You received the <strong>wrong product</strong> (different item from what you ordered)</li>
                <li>The product arrived <strong>visibly damaged, spoiled, or contaminated</strong></li>
                <li>The quantity delivered was <strong>significantly less</strong> than what you ordered and paid for</li>
                <li>A packaged product was <strong>already open or unsealed</strong> upon delivery</li>
                <li>The product is <strong>past its expiry date</strong> at time of delivery</li>
              </ul>
              <p>In all eligible cases, you may choose between a <strong>full refund</strong> or a <strong>replacement delivery</strong>.</p>
            </ReturnSection>

            <ReturnSection id="ineligible" number={3} title="What Cannot Be Returned">
              <p>The following situations are not eligible for returns or refunds:</p>
              <ul>
                <li>Change of mind after the order is delivered</li>
                <li>Fresh produce (fruits, vegetables) with natural variations in size, shape, or colour — these are characteristics of natural food, not defects</li>
                <li>Products that have been opened, partially consumed, or stored incorrectly after delivery</li>
                <li>Issues reported more than 24 hours after delivery</li>
                <li>Minor cosmetic imperfections in packaging that do not affect the product</li>
              </ul>
            </ReturnSection>

            <ReturnSection id="process" number={4} title="How to Request a Return">
              <p>To raise a return or refund request:</p>
              <ol>
                <li>Contact us via <strong>WhatsApp within 24 hours</strong> of receiving your order</li>
                <li>Share your <strong>order number</strong> (found in your order confirmation message)</li>
                <li>Send <strong>clear photos</strong> of the issue — the product, packaging, and any visible damage</li>
                <li>Our team will review your request and respond within <strong>4 business hours</strong></li>
                <li>If approved, we will arrange either a replacement or refund as agreed</li>
              </ol>
              {settings.admin_whatsapp && (
                <p>
                  <strong>WhatsApp:</strong>{' '}
                  <a href={`https://wa.me/${settings.admin_whatsapp.replace(/[^0-9]/g, '')}`}
                    className="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">
                    {settings.admin_whatsapp}
                  </a>
                </p>
              )}
            </ReturnSection>

            <ReturnSection id="refunds" number={5} title="Refunds">
              <ul>
                <li>Approved refunds are processed within <strong>3–5 business days</strong>.</li>
                <li>For <strong>bank transfer orders</strong> — refund is credited back to the same account used for payment.</li>
                <li>For <strong>Cash on Delivery orders</strong> — refund is issued via bank transfer or JazzCash/Easypaisa. You will need to provide your account details.</li>
                <li>Delivery fees are non-refundable unless the error was entirely on our part.</li>
              </ul>
            </ReturnSection>

            <ReturnSection id="damaged" number={6} title="Damaged or Wrong Items">
              <p>
                If your order arrives damaged or contains the wrong items, we take full responsibility.
                Contact us immediately on WhatsApp with photos and we will arrange a replacement at no cost
                or issue a full refund — your choice. We may also arrange collection of the incorrect item
                at our own cost.
              </p>
            </ReturnSection>

            <ReturnSection id="contact" number={7} title="Contact Us">
              <p>For all return and refund queries:</p>
              <ul>
                {settings.admin_whatsapp && (
                  <li>
                    <strong>WhatsApp (fastest):</strong>{' '}
                    <a href={`https://wa.me/${settings.admin_whatsapp.replace(/[^0-9]/g, '')}`}
                      className="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">
                      {settings.admin_whatsapp}
                    </a>
                  </li>
                )}
                {settings.admin_email && <li><strong>Email:</strong> {settings.admin_email}</li>}
                <li><strong>Contact form:</strong> <Link href="/contact" className="text-primary-600 hover:underline">khaalisharvest.com/contact</Link></li>
              </ul>
            </ReturnSection>

            {/* CTA */}
            <div className="bg-gradient-to-r from-primary-700 to-primary-600 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
              <div>
                <p className="text-white font-semibold">Something wrong with your order?</p>
                <p className="text-primary-200 text-sm mt-0.5">Message us on WhatsApp — we'll sort it out fast.</p>
              </div>
              <Link href="/contact"
                className="flex-shrink-0 inline-flex items-center gap-2 bg-white text-primary-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-primary-50 transition-colors shadow-sm">
                Contact Us
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function ReturnSection({ id, number, title, children }: {
  id: string; number: number; title: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 scroll-mt-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-earth-100 text-earth-700 text-sm font-bold flex-shrink-0">
          {number}
        </span>
        <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
      </div>
      <div className="prose prose-sm prose-neutral max-w-none prose-a:text-primary-600 prose-strong:text-neutral-800 prose-li:text-neutral-600 prose-p:text-neutral-600 prose-p:leading-relaxed prose-ol:text-neutral-600">
        {children}
      </div>
    </section>
  );
}
