'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import ProductLoader from '@/components/ui/ProductLoader';

function fmt(n: number) {
  return Number(n).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// Small decorative dot — purely visual, no content
function Dot({ style }: { style: React.CSSProperties }) {
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full bg-primary-400 opacity-60"
      style={style}
      animate={{ y: [0, -12, 0], opacity: [0.6, 0.2, 0.6] }}
      transition={{ duration: 2.4 + Math.random() * 1.2, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verified, setVerified] = useState(false);

  const orderNumber = searchParams.get('orderNumber');

  useEffect(() => {
    const stored = sessionStorage.getItem('pending_confirmation');
    if (!stored && !orderNumber) {
      router.replace('/');
      return;
    }
    if (stored) sessionStorage.removeItem('pending_confirmation');
    setVerified(true);
  }, [orderNumber, router]);

  if (!verified) return null;

  const total = searchParams.get('total');
  const paymentMethod = searchParams.get('paymentMethod');
  const isGuest = searchParams.get('guest') === 'true';

  const paymentLabel = paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery'
    : paymentMethod === 'bank_transfer' ? 'Bank Transfer' : paymentMethod;

  const whatsNextBullets =
    paymentMethod === 'cash_on_delivery'
      ? [
          "We'll call you to confirm delivery time",
          'Pay cash when your order arrives',
          'Fresh products delivered to your door',
        ]
      : paymentMethod === 'bank_transfer'
      ? [
          'Complete your bank transfer to confirm the order',
          'Send payment screenshot on WhatsApp to our team',
          "We'll process your order after payment confirmation",
        ]
      : [
          'Our team will contact you to confirm your order',
          'Fresh products delivered to your door',
        ];

  // Decorative dots positions — static, no Math.random() in render
  const dots = [
    { top: '12%', left: '10%' }, { top: '20%', right: '12%' },
    { top: '70%', left: '8%'  }, { top: '75%', right: '9%'  },
    { top: '45%', left: '5%'  }, { top: '40%', right: '6%'  },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ background: 'linear-gradient(160deg, #f0f7ee 0%, #fafaf7 60%, #f0f7ee 100%)' }}>

      {/* Decorative floating dots */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {dots.map((s, i) => <Dot key={i} style={s} />)}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-primary-100 overflow-hidden"
      >
        {/* Top accent band */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary-400 via-primary-600 to-primary-400" />

        <div className="p-8 text-center">

          {/* Logo + animated check */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.45, ease: 'backOut' }}
            className="relative w-24 h-24 mx-auto mb-5"
          >
            {/* Pulsing ring behind */}
            <motion.div
              className="absolute inset-0 rounded-full bg-primary-100"
              animate={{ scale: [1, 1.15, 1], opacity: [0.7, 0.2, 0.7] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Logo */}
            <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
              <Image src="/images/logo.png" alt="Khaalis Harvest" width={56} height={56} className="object-contain" />
            </div>
            {/* Check badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, duration: 0.3, ease: 'backOut' }}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center shadow-md"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <motion.path
                  strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.55, duration: 0.4, ease: 'easeOut' }}
                />
              </svg>
            </motion.div>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.35 }}
          >
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Order Placed!</h1>
            <p className="text-neutral-500 mb-6 leading-relaxed">
              Thank you for your order. We'll contact you soon to confirm delivery.
            </p>
          </motion.div>

          {/* Order number */}
          {orderNumber && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.35 }}
              className="bg-primary-50 border border-primary-200 rounded-2xl p-4 mb-5"
            >
              <p className="text-xs text-neutral-500 mb-1 uppercase tracking-wide font-medium">Order Number</p>
              <p className="text-xl font-bold text-primary-700">{orderNumber}</p>
            </motion.div>
          )}

          {/* Total + Payment */}
          {(total || paymentLabel) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.35 }}
              className={`grid gap-3 mb-6 ${total && paymentLabel ? 'grid-cols-2' : 'grid-cols-1 max-w-xs mx-auto'}`}
            >
              {total && (
                <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                  <p className="text-xs text-neutral-500 mb-1 uppercase tracking-wide font-medium">Total Amount</p>
                  <p className="font-bold text-neutral-800 text-lg">₨{fmt(parseFloat(total))}</p>
                </div>
              )}
              {paymentLabel && (
                <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                  <p className="text-xs text-neutral-500 mb-1 uppercase tracking-wide font-medium">Payment</p>
                  <p className="font-bold text-neutral-800 text-lg">{paymentLabel}</p>
                </div>
              )}
            </motion.div>
          )}

          {/* What's next */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.35 }}
            className="bg-primary-50 border border-primary-100 rounded-xl p-4 mb-7 text-left"
          >
            <h3 className="font-semibold text-primary-700 mb-2.5 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              What's next?
            </h3>
            <ul className="space-y-2">
              {whatsNextBullets.map((bullet, i) => (
                <li key={bullet} className="flex items-start gap-2.5 text-sm text-primary-700">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 text-xs font-bold mt-0.5">
                    {i + 1}
                  </span>
                  {bullet}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.35 }}
            className="flex gap-3"
          >
            {!isGuest && (
              <Link href="/orders" className="flex-1 btn-outline text-center">
                View Orders
              </Link>
            )}
            <Link href="/products" className="flex-1 btn-primary text-center">
              Continue Shopping
            </Link>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <ProductLoader size="md" />
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
