'use client';

import Link from 'next/link';
import OrganicPattern from '@/components/ui/OrganicPattern';
import { usePublicSettings } from '@/hooks/usePublicSettings';
import { APP_NAME } from '@/config/env';

const LAST_UPDATED = 'August 10, 2026';

const sections = [
  { id: 'acceptance',   title: 'Acceptance of Terms' },
  { id: 'eligibility',  title: 'Eligibility' },
  { id: 'products',     title: 'Products & Pricing' },
  { id: 'orders',       title: 'Orders & Payment' },
  { id: 'delivery',     title: 'Delivery' },
  { id: 'conduct',      title: 'Acceptable Use' },
  { id: 'liability',    title: 'Limitation of Liability' },
  { id: 'governing',    title: 'Governing Law' },
  { id: 'contact',      title: 'Contact Us' },
];

export default function TermsConditionsPage() {
  const { settings } = usePublicSettings();
  const appName = APP_NAME || 'Khaalis Harvest';

  return (
    <div className="min-h-screen bg-neutral-50 relative">
      <OrganicPattern />

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-700 overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10S0 14.5 0 20s4.5 10 10 10 10-4.5 10-10zm0 0c0 5.5 4.5 10 10 10s10-4.5 10-10-4.5-10-10-10-10 4.5-10 10z'/%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative container-custom py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-neutral-300 text-xs font-medium mb-5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Legal Document
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">Terms & Conditions</h1>
          <p className="text-neutral-400 text-sm">Last updated: {LAST_UPDATED}</p>
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
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-600 text-[10px] font-bold flex-shrink-0 group-hover:bg-primary-100 group-hover:text-primary-700 transition-colors">
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

            <div className="bg-neutral-100 border border-neutral-200 rounded-2xl p-6">
              <p className="text-neutral-700 leading-relaxed text-sm">
                These Terms & Conditions govern your use of the <strong>{appName}</strong> website and services.
                Please read them carefully before placing an order. By using our site or purchasing from us,
                you agree to be bound by these terms.
              </p>
            </div>

            <TermsSection id="acceptance" number={1} title="Acceptance of Terms">
              <p>
                By accessing or using the {appName} website (khaalisharvest.com), creating an account,
                or placing an order, you confirm that you have read, understood, and agree to these
                Terms & Conditions in full. If you do not agree, please do not use our services.
              </p>
            </TermsSection>

            <TermsSection id="eligibility" number={2} title="Eligibility">
              <ul>
                <li>You must be at least 18 years of age to place an order.</li>
                <li>You must provide accurate and complete information when registering or checking out as a guest.</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                <li>Currently, we deliver within Pakistan only.</li>
              </ul>
            </TermsSection>

            <TermsSection id="products" number={3} title="Products & Pricing">
              <ul>
                <li>All prices are listed in Pakistani Rupees (PKR) and include applicable taxes where stated.</li>
                <li>Prices may change at any time without prior notice. The price at the time of order confirmation is the final price.</li>
                <li>Product images are for illustration purposes. Actual appearance of fresh produce and unpackaged items may vary slightly by season.</li>
                <li>We reserve the right to withdraw any product from sale at any time.</li>
                <li>"Pure" and "Natural" descriptions refer to our sourcing standards — products without synthetic additives or preservatives. These terms do not imply formal PSQCA organic certification unless explicitly stated.</li>
              </ul>
            </TermsSection>

            <TermsSection id="orders" number={4} title="Orders & Payment">
              <ul>
                <li>Orders are confirmed only after you receive a confirmation message via WhatsApp or email.</li>
                <li>We accept <strong>Cash on Delivery (COD)</strong> and <strong>Bank Transfer</strong>.</li>
                {settings.bank_name && (
                  <li>For bank transfers, payment must be sent to <strong>{settings.bank_name}</strong> before dispatch. Orders without confirmed payment will not be processed.</li>
                )}
                <li>We reserve the right to cancel any order if stock is unavailable, the delivery address is unserviceable, or fraud is suspected.</li>
                <li>Minimum order amounts may apply and are shown at checkout.</li>
              </ul>
            </TermsSection>

            <TermsSection id="delivery" number={5} title="Delivery">
              <ul>
                <li>Delivery timelines are estimates and may vary due to weather, location, or high demand.</li>
                <li>You are responsible for providing a complete and accurate delivery address. We are not liable for failed deliveries due to incorrect addresses.</li>
                {settings.delivery_fee > 0 && (
                  <li>A delivery fee of PKR {settings.delivery_fee.toLocaleString()} applies to orders below the free delivery threshold.</li>
                )}
                {settings.free_delivery_threshold > 0 && (
                  <li>Orders above PKR {settings.free_delivery_threshold.toLocaleString()} qualify for free delivery.</li>
                )}
                <li>Risk of loss passes to you upon delivery. Please inspect your order upon receipt.</li>
              </ul>
            </TermsSection>

            <TermsSection id="conduct" number={6} title="Acceptable Use">
              <p>You agree not to:</p>
              <ul>
                <li>Use the website for any unlawful purpose</li>
                <li>Submit false or misleading information</li>
                <li>Attempt to gain unauthorised access to our systems</li>
                <li>Post fraudulent reviews or abuse the review system</li>
                <li>Resell our products commercially without prior written agreement</li>
              </ul>
            </TermsSection>

            <TermsSection id="liability" number={7} title="Limitation of Liability">
              <p>
                To the fullest extent permitted by Pakistani law, {appName} shall not be liable for
                any indirect, incidental, or consequential damages arising from the use of our products or services.
                Our total liability for any claim shall not exceed the value of the order in question.
                We are not responsible for delays or failures caused by events beyond our reasonable control
                (force majeure), including extreme weather, civil unrest, or utility failures.
              </p>
            </TermsSection>

            <TermsSection id="governing" number={8} title="Governing Law">
              <p>
                These Terms & Conditions are governed by and construed in accordance with the laws of
                the Islamic Republic of Pakistan. Any disputes arising from these terms shall be subject
                to the exclusive jurisdiction of the courts of Lahore, Punjab, Pakistan.
              </p>
            </TermsSection>

            <TermsSection id="contact" number={9} title="Contact Us">
              <p>Questions about these terms? Reach us at:</p>
              <ul>
                {settings.admin_whatsapp && <li><strong>WhatsApp:</strong> {settings.admin_whatsapp}</li>}
                {settings.admin_email && <li><strong>Email:</strong> {settings.admin_email}</li>}
                <li><strong>Contact form:</strong> <Link href="/contact" className="text-primary-600 hover:underline">khaalisharvest.com/contact</Link></li>
              </ul>
            </TermsSection>

            {/* CTA */}
            <div className="bg-gradient-to-r from-neutral-800 to-neutral-700 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
              <div>
                <p className="text-white font-semibold">Questions about your order?</p>
                <p className="text-neutral-400 text-sm mt-0.5">We're here to help — always.</p>
              </div>
              <Link href="/contact"
                className="flex-shrink-0 inline-flex items-center gap-2 bg-white text-neutral-800 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-neutral-100 transition-colors shadow-sm">
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

function TermsSection({ id, number, title, children }: {
  id: string; number: number; title: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 scroll-mt-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-700 text-sm font-bold flex-shrink-0">
          {number}
        </span>
        <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
      </div>
      <div className="prose prose-sm prose-neutral max-w-none prose-a:text-primary-600 prose-strong:text-neutral-800 prose-li:text-neutral-600 prose-p:text-neutral-600 prose-p:leading-relaxed">
        {children}
      </div>
    </section>
  );
}
