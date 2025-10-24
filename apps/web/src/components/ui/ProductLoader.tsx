'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface ProductLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ProductLoader({ size = 'md', className = '' }: ProductLoaderProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {/* Animated Khaalis Harvest Logo */}
      <div className="relative">
        <motion.div
          className={`${sizeClasses[size]} relative`}
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 2, -2, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Image
            src="/images/logo.png"
            alt="Khaalis Harvest Logo"
            fill
            className="object-contain"
          />
        </motion.div>
        
        {/* Organic particles floating around */}
        <motion.div
          className="absolute -top-3 -right-3 w-3 h-3 bg-primary-400 rounded-full"
          animate={{
            y: [0, -12, 0],
            x: [0, 4, 0],
            opacity: [0.6, 1, 0.6],
            scale: [0.8, 1.1, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: 0.3,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-2 -left-2 w-2 h-2 bg-accent-400 rounded-full"
          animate={{
            y: [0, -10, 0],
            x: [0, -3, 0],
            opacity: [0.5, 1, 0.5],
            scale: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            delay: 0.8,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1 -right-4 w-1.5 h-1.5 bg-primary-300 rounded-full"
          animate={{
            y: [0, -8, 0],
            x: [0, 2, 0],
            opacity: [0.4, 0.9, 0.4],
            scale: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            delay: 1.2,
            ease: "easeInOut"
          }}
        />
      </div>
      
      {/* Loading text with Khaalis Harvest branding */}
      <motion.div
        className="text-neutral-600 font-medium text-center"
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="text-sm font-semibold text-primary-600 mb-1">Khaalis Harvest</div>
        <div className="text-xs">Loading pure organic products...</div>
      </motion.div>
      
      {/* Organic loading dots */}
      <div className="flex space-x-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-gradient-to-r from-primary-400 to-accent-400 rounded-full"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </div>
  );
}
