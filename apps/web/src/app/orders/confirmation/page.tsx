'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ProductLoader from '@/components/ui/ProductLoader';

function fmt(n: number) {
  return Number(n).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber');
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

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full bg-white rounded-3xl shadow-sm border border-neutral-100 p-8 text-center"
      >
        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Order Placed!</h1>
        <p className="text-neutral-600 mb-6">
          Thank you for your order. We'll contact you soon to confirm delivery.
        </p>

        {orderNumber && (
          <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 mb-6">
            <p className="text-sm text-neutral-500 mb-1">Order Number</p>
            <p className="text-xl font-bold text-primary-700">{orderNumber}</p>
          </div>
        )}

        {(total || paymentLabel) && (
          <div className={`grid gap-4 mb-8 ${total && paymentLabel ? 'grid-cols-2' : 'grid-cols-1 max-w-xs mx-auto'}`}>
            {total && (
              <div className="bg-neutral-50 rounded-xl p-4">
                <p className="text-xs text-neutral-500 mb-1">Total Amount</p>
                <p className="font-bold text-neutral-800">₨{fmt(parseFloat(total))}</p>
              </div>
            )}
            {paymentLabel && (
              <div className="bg-neutral-50 rounded-xl p-4">
                <p className="text-xs text-neutral-500 mb-1">Payment</p>
                <p className="font-bold text-neutral-800">{paymentLabel}</p>
              </div>
            )}
          </div>
        )}

        <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 mb-8 text-left">
          <h3 className="font-semibold text-primary-700 mb-2">What's next?</h3>
          <ul className="space-y-1.5 text-sm text-primary-600 list-disc list-inside">
            {whatsNextBullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>

        <div className="flex gap-3">
          {!isGuest && (
            <Link href="/orders" className="flex-1 btn-outline text-center">
              View Orders
            </Link>
          )}
          <Link href="/products" className="flex-1 btn-primary text-center">
            Continue Shopping
          </Link>
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
