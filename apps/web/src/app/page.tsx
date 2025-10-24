'use client';

import { motion } from 'framer-motion';
import ProductsSection from '@/components/sections/ProductsSection';
import HowItWorks from '@/components/sections/HowItWorks';
import CTA from '@/components/sections/CTA';
import ResponsiveBackgroundImage from '@/components/ui/ResponsiveBackgroundImage';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Single Continuous Background for Hero + Products */}
      <ResponsiveBackgroundImage
        src="/images/hero.png"
        alt="Fresh organic products background"
        overlayType="hero"
        priority={true}
        quality={90}
        objectPosition="center"
        fitContent={false}
        minHeight="min-h-screen"
        className="py-8"
      >
        <div className="container-custom">
          {/* Hero Section */}
          <div className="max-w-3xl mx-auto text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <h1 className="text-5xl md:text-7xl font-extrabold text-neutral-900 mb-4 tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-accent-500 to-primary-600">
                  Khaalis
                </span>{' '}
                <span className="text-neutral-800">Harvest</span>
              </h1>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="mb-6"
              >
                <p className="text-2xl md:text-3xl font-medium text-neutral-800 mb-3 tracking-wide">
                  Pure Organic Products
                </p>
                <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-accent-500 mx-auto rounded-full"></div>
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-lg md:text-xl font-medium text-neutral-700 mb-4 tracking-wide"
              >
                Fresh • Local • Delivered
              </motion.p>
            </motion.div>
          </div>

          {/* Products Section */}
          <div className="max-w-7xl mx-auto">
            <ProductsSection showOnly={8} />
          </div>
          <div className="text-center mt-8">
            <a
              href="/products"
              className="btn-primary inline-flex items-center"
            >
              View All Products
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </ResponsiveBackgroundImage>
      
      <HowItWorks />
      <CTA />
    </main>
  );
}
