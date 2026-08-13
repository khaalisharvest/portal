'use client';

import Link from 'next/link';
import OrganicPattern from '@/components/ui/OrganicPattern';
import { usePublicSettings } from '@/hooks/usePublicSettings';
import { APP_NAME } from '@/config/env';

const LAST_UPDATED = 'August 10, 2026';

const sections = [
  { id: 'information', title: 'Information We Collect' },
  { id: 'usage',       title: 'How We Use Your Information' },
  { id: 'sharing',     title: 'Information Sharing' },
  { id: 'security',    title: 'Data Security' },
  { id: 'cookies',     title: 'Cookies' },
  { id: 'rights',      title: 'Your Rights' },
  { id: 'contact',     title: 'Contact Us' },
];

export default function PrivacyPolicyPage() {
  const { settings } = usePublicSettings();
  const appName = APP_NAME || 'Khaalis Harvest';

  return (
    <div className="min-h-screen bg-neutral-50 relative">
      <OrganicPattern />

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative container-custom py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-primary-100 text-xs font-medium mb-5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Legal Document
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">Privacy Policy</h1>
          <p className="text-primary-200 text-sm">Last updated: {LAST_UPDATED}</p>
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
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-primary-100 text-primary-700 text-[10px] font-bold flex-shrink-0 group-hover:bg-primary-200 transition-colors">
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

            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-6">
              <p className="text-neutral-700 leading-relaxed text-sm">
                At <strong className="text-primary-700">{appName}</strong>, your privacy matters as much as the purity of our products.
                This policy explains what personal information we collect, how we use it, and your choices.
                By using our website or placing an order, you agree to this policy.
              </p>
            </div>

            <PolicySection id="information" number={1} title="Information We Collect">
              <p>We collect information you provide directly when you use our services:</p>
              <ul>
                <li><strong>Account details</strong> — name, email address, phone number, and password when you register.</li>
                <li><strong>Order details</strong> — delivery address, items ordered, and your chosen payment method (cash on delivery or bank transfer).</li>
                <li><strong>Messages</strong> — content you send through our contact form or WhatsApp.</li>
              </ul>
              <p>We also collect information automatically:</p>
              <ul>
                <li><strong>Usage data</strong> — pages visited, products viewed, and session duration.</li>
                <li><strong>Device data</strong> — browser type, IP address, and operating system (collected for security and analytics only).</li>
              </ul>
            </PolicySection>

            <PolicySection id="usage" number={2} title="How We Use Your Information">
              <p>We use your information solely to run and improve our service:</p>
              <ul>
                <li>Process and fulfil your orders</li>
                <li>Send order confirmations and delivery updates via WhatsApp and email</li>
                <li>Respond to your support requests</li>
                <li>Improve our products and website experience</li>
                <li>Comply with legal obligations under Pakistani law, including Punjab Food Authority (PFA) requirements</li>
              </ul>
              <p className="font-medium text-primary-700">We will never sell your personal information to third parties for marketing purposes.</p>
            </PolicySection>

            <PolicySection id="sharing" number={3} title="Information Sharing">
              <p>We share your information only in the following limited cases:</p>
              <ul>
                <li><strong>Delivery staff</strong> — your name, address, and phone number are shared with our riders to deliver your order.</li>
                <li><strong>Service providers</strong> — we use Cloudinary (image hosting) and Brevo (email). They process data only as we direct.</li>
                <li><strong>Legal requirements</strong> — we may disclose information if required by Pakistani law or a valid government order.</li>
              </ul>
            </PolicySection>

            <PolicySection id="security" number={4} title="Data Security">
              <p>
                We protect your data with encrypted connections (HTTPS), securely hashed passwords, and strictly
                controlled database access. No internet transmission is 100% secure, but we take every reasonable
                measure to protect your information. If you suspect unauthorised access to your account,
                contact us immediately via WhatsApp.
              </p>
            </PolicySection>

            <PolicySection id="cookies" number={5} title="Cookies">
              <p>
                We use only essential cookies — to keep you signed in and remember your basket across pages.
                We do <strong>not</strong> use advertising or third-party tracking cookies.
                You can disable cookies in your browser settings, though some site features may not function correctly.
              </p>
            </PolicySection>

            <PolicySection id="rights" number={6} title="Your Rights">
              <p>You have the right to:</p>
              <ul>
                <li>Access the personal information we hold about you</li>
                <li>Request correction of any inaccurate information</li>
                <li>Request deletion of your account and associated data</li>
                <li>Opt out of marketing messages at any time</li>
              </ul>
              <p>To exercise any right, contact us using the details below. We will respond within 7 business days.</p>
            </PolicySection>

            <PolicySection id="contact" number={7} title="Contact Us">
              <p>For privacy-related questions or requests, reach out through:</p>
              <ul>
                {settings.admin_whatsapp && (
                  <li><strong>WhatsApp:</strong> {settings.admin_whatsapp}</li>
                )}
                {settings.admin_email && (
                  <li><strong>Email:</strong> {settings.admin_email}</li>
                )}
                <li><strong>Contact form:</strong> <Link href="/contact" className="text-primary-600 hover:underline">khaalisharvest.com/contact</Link></li>
                <li><strong>Business:</strong> M/S {appName}, Lahore, Punjab, Pakistan</li>
              </ul>
            </PolicySection>

            <LegalCTA />
          </main>
        </div>
      </div>
    </div>
  );
}

function PolicySection({ id, number, title, children }: {
  id: string; number: number; title: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 scroll-mt-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-100 text-primary-700 text-sm font-bold flex-shrink-0">
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

function LegalCTA() {
  return (
    <div className="bg-gradient-to-r from-primary-700 to-primary-600 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
      <div>
        <p className="text-white font-semibold">Have questions about your privacy?</p>
        <p className="text-primary-200 text-sm mt-0.5">Our team responds within 24 hours.</p>
      </div>
      <Link href="/contact"
        className="flex-shrink-0 inline-flex items-center gap-2 bg-white text-primary-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-primary-50 transition-colors shadow-sm">
        Contact Us
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
