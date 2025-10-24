'use client';

import { motion } from 'framer-motion';
import ResponsiveBackgroundImage from '@/components/ui/ResponsiveBackgroundImage';

export default function Hero() {
  return (
    <ResponsiveBackgroundImage
      src="/images/hero.png"
      alt="Fresh organic products background"
      overlayType="hero"
      priority={true}
      quality={90}
      objectPosition="center"
      fitContent={true}
      mobileMinHeight="min-h-[400px]"
      className="py-8"
    >
      <div className="container-custom">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-4"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 mb-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-accent-500">
                Khaalis
              </span>{' '}
              Harvest
            </h1>
            <p className="text-xl md:text-3xl font-semibold text-neutral-700 mb-2">
              The Pure Embrace
            </p>
            <p className="text-lg md:text-xl text-neutral-600">
              Fresh Organic Products • Delivered to Your Door
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-base text-neutral-600 mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Pakistan's premier organic marketplace offering pure, unadulterated products. 
            Experience the authentic taste of nature with our carefully curated selection of organic goods.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <a
              href="/products"
              className="btn-primary text-lg px-8 py-4 shadow-glow hover:shadow-glow-soft"
            >
              Explore Products
            </a>
            <a
              href="/about"
              className="btn-outline text-lg px-8 py-4"
            >
              Learn More
            </a>
          </motion.div>

        </div>
      </div>
    </ResponsiveBackgroundImage>
  );
}

