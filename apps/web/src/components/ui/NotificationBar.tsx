'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

interface NotificationBarSettings {
  isEnabled: boolean;
  text: string;
  backgroundColor: string;
  textColor: string;
  speed: number;
}

export default function NotificationBar() {
  const [settings, setSettings] = useState<NotificationBarSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSettings();
    
    // Refresh settings every 5 minutes to get updates
    const interval = setInterval(fetchSettings, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/v1/settings/notification-bar');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.data || data);
      }
    } catch (error) {
      console.error('Error fetching notification bar settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dynamically calculate number of copies based on text length
  // This ensures smooth scrolling for any text length - short, long, or very long
  const textCopies = useMemo(() => {
    if (!settings?.text) return [];
    
    const textLength = settings.text.length;
    let copies = 4; // Base number of copies
    
    // For very short text (< 20 chars), use more copies for smooth scrolling
    if (textLength < 20) {
      copies = 8;
    }
    // For short text (20-50 chars), use moderate copies
    else if (textLength < 50) {
      copies = 6;
    }
    // For medium text (50-100 chars), use base copies
    else if (textLength < 100) {
      copies = 4;
    }
    // For long text (100-200 chars), use fewer copies (text is already long)
    else if (textLength < 200) {
      copies = 3;
    }
    // For very long text (200+ chars), use minimal copies (text is very long)
    else {
      copies = 2;
    }
    
    return Array(copies).fill(settings.text);
  }, [settings?.text]);

  if (loading || !settings || !settings.isEnabled || !settings.text) {
    return null;
  }

  // Calculate animation duration based on speed (lower speed = faster animation)
  // Speed range: 10-100, where 10 is fastest and 100 is slowest
  const duration = Math.max(10, Math.min(100, settings.speed || 50));
  const animationDuration = `${duration}s`;
  
  // Calculate the translation percentage based on number of copies
  // For seamless loop: move by (100 / number of copies)%
  const translationPercentage = -(100 / textCopies.length);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden w-full"
      style={{
        backgroundColor: settings.backgroundColor,
        color: settings.textColor,
        minHeight: '40px',
        maxHeight: '48px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div className="flex items-center h-10 md:h-12 relative w-full overflow-hidden" style={{ width: '100%', maxWidth: '100%' }}>
        <div
          ref={contentRef}
          className="flex items-center whitespace-nowrap notification-scroll"
          style={{
            '--animation-duration': animationDuration,
            '--translate-percent': `${translationPercentage}%`,
          } as React.CSSProperties}
        >
          {/* Duplicate content multiple times for seamless loop on all screen sizes */}
          {textCopies.map((text, index) => (
            <span 
              key={index}
              className="px-4 sm:px-6 md:px-8 text-xs sm:text-sm md:text-base font-medium flex-shrink-0"
              style={{
                whiteSpace: 'nowrap',
              }}
            >
              {text}
            </span>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .notification-scroll {
          display: inline-flex;
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          align-items: center;
          animation: notification-scroll var(--animation-duration, 50s) linear infinite;
          will-change: transform;
          /* Performance optimizations for smooth scrolling */
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          perspective: 1000px;
          -webkit-perspective: 1000px;
          /* Start with text visible immediately - positioned at 0 */
          transform: translateX(0) translateZ(0);
          -webkit-transform: translateX(0) translateZ(0);
        }

        @keyframes notification-scroll {
          0% {
            /* Start visible - text appears immediately */
            transform: translateX(0) translateZ(0);
            -webkit-transform: translateX(0) translateZ(0);
          }
          100% {
            /* Move by one copy's width for seamless loop */
            transform: translateX(var(--translate-percent, -25%)) translateZ(0);
            -webkit-transform: translateX(var(--translate-percent, -25%)) translateZ(0);
          }
        }

        /* Ensure smooth scrolling on all devices and browsers */
        @media (prefers-reduced-motion: reduce) {
          .notification-scroll {
            animation-duration: calc(var(--animation-duration, 50s) * 2);
          }
        }

        /* Optimize for mobile devices */
        @media (max-width: 640px) {
          .notification-scroll {
            animation-timing-function: linear;
          }
        }

        /* Ensure proper rendering on all browsers */
        @supports (transform: translateZ(0)) {
          .notification-scroll {
            transform: translateZ(0);
            -webkit-transform: translateZ(0);
          }
        }
      `}</style>
    </div>
  );
}


