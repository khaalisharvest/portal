'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        {/* Animated Khaalis Harvest Logo */}
        <motion.div
          className="w-20 h-20 relative"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 360],
          }}
          transition={{
            scale: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            },
            rotate: {
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }
          }}
        >
          <Image
            src="/images/logo.png"
            alt="Khaalis Harvest Logo"
            fill
            className="object-contain"
          />
        </motion.div>
        
        {/* Loading text */}
        <motion.div
          className="text-neutral-600 font-medium text-center"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="text-lg font-semibold text-primary-600 mb-1">Khaalis Harvest</div>
          <div className="text-sm">Loading pure organic experience...</div>
        </motion.div>
      </div>
    </div>
  );
}
