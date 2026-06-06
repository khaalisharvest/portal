'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber');
  const total = searchParams.get('total');
  const paymentMethod = searchParams.get('paymentMethod');
  const isGuest = searchParams.get('guest') === 'true';

  const paymentLabel = paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery'
    : paymentMethod === 'bank_transfer' ? 'Bank Transfer' : paymentMethod;

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full bg-white rounded-3xl shadow-strong p-8 text-center"
      >
        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-neutral-800 mb-2">Order Placed!</h1>
        <p className="text-neutral-600 mb-6">
          Thank you for your order. We'll contact you soon to confirm delivery.
        </p>

        {orderNumber && (
          <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4 mb-6">
            <p className="text-sm text-neutral-500 mb-1">Order Number</p>
            <p className="text-xl font-bold text-primary-700">{orderNumber}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-8">
          {total && (
            <div className="bg-neutral-50 rounded-xl p-4">
              <p className="text-xs text-neutral-500 mb-1">Total Amount</p>
              <p className="font-bold text-neutral-800">PKR {parseFloat(total).toLocaleString()}</p>
            </div>
          )}
          {paymentLabel && (
            <div className="bg-neutral-50 rounded-xl p-4">
              <p className="text-xs text-neutral-500 mb-1">Payment</p>
              <p className="font-bold text-neutral-800">{paymentLabel}</p>
            </div>
          )}
        </div>

        <div className="bg-accent-50 border border-accent-200 rounded-xl p-4 mb-8 text-left">
          <h3 className="font-semibold text-accent-800 mb-2">What's next?</h3>
          <ul className="space-y-1 text-sm text-accent-700">
            <li>• We'll call you to confirm delivery time</li>
            <li>• Payment on delivery (COD)</li>
            <li>• Fresh products delivered to your door</li>
          </ul>
        </div>

        <div className="flex gap-3">
          {!isGuest && (
            <Link href="/orders" className="flex-1 btn-secondary text-center">
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
