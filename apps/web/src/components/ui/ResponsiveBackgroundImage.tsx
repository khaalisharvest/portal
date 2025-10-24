'use client';

import Image from 'next/image';
import { ReactNode } from 'react';

interface ResponsiveBackgroundImageProps {
  src: string;
  alt: string;
  children: ReactNode;
  className?: string;
  overlay?: ReactNode;
  overlayType?: string;
  priority?: boolean;
  quality?: number;
  objectPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top left' | 'top right' | 'bottom left' | 'bottom right';
  minHeight?: string; // Only used for mobile screens or when fitContent is false
  fitContent?: boolean; // Makes background truly adapt to content height
  mobileMinHeight?: string; // Separate minimum height for mobile only
}

export default function ResponsiveBackgroundImage({
  src,
  alt,
  children,
  className = '',
  overlay,
  overlayType,
  priority = false,
  quality = 80,
  objectPosition = 'center',
  minHeight,
  fitContent = true,
  mobileMinHeight = 'min-h-[400px]'
}: ResponsiveBackgroundImageProps) {
  // When fitContent is true, use responsive min-height that only applies to mobile
  // On larger screens, let content determine height completely
  const containerClasses = fitContent 
    ? `relative overflow-hidden ${mobileMinHeight} md:min-h-0 ${className}`.trim()
    : `relative overflow-hidden ${minHeight || 'min-h-[400px]'} ${className}`.trim();

  return (
    <div className={containerClasses}>
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          quality={quality}
          className="object-cover w-full h-full"
          style={{
            objectPosition: objectPosition,
            width: '100%',
            height: '100%'
          }}
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 100vw, (max-width: 1280px) 100vw, 100vw"
        />
        {/* Custom overlay if provided, or use overlayType */}
        {overlay || (overlayType && getBackgroundOverlay(overlayType))}
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// Predefined overlay variants - using functions to avoid SSR issues
export const getBackgroundOverlay = (type: string) => {
  switch (type) {
    case 'hero':
      return <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/50 to-white/70"></div>;
    case 'contact':
      return <div className="absolute inset-0 bg-gradient-to-r from-white/60 to-primary-100/80"></div>;
    case 'about':
      return <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/30 to-black/40"></div>;
    case 'products':
      return <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/80 to-white/90"></div>;
    case 'organic_products': // Updated for organic products
      return <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/80 to-white/90"></div>;
    case 'home':
      return <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/80 to-white/90"></div>;
    case 'subtle':
      return <div className="absolute inset-0 bg-black/10"></div>;
    case 'dark':
      return <div className="absolute inset-0 bg-black/40"></div>;
    case 'organic':
      return <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-accent-500/5 to-secondary-500/10"></div>;
    default:
      return null;
  }
};

// Legacy export for backward compatibility
export const BackgroundOverlays = {
  hero: 'hero',
  contact: 'contact',
  about: 'about',
  products: 'products',
  organic_products: 'organic_products', // Updated for organic products
  home: 'home',
  subtle: 'subtle',
  dark: 'dark',
  organic: 'organic'
};
