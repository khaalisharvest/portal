/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // PRIMARY — Forest Green (trust, organic, nature)
        primary: {
          50:  '#f0f7ee',
          100: '#d8ecd4',
          200: '#b4d9ab',
          300: '#8bc280',
          400: '#62a955',
          500: '#3d7a2e',  // Deeper forest green (was #4B8B3B)
          600: '#2f6022',
          700: '#234718',
          800: '#172e10',
          900: '#0c1808',
        },
        // SECONDARY — Warm Saffron/Amber (appetite, warmth, Pakistani cultural resonance)
        // This is the CTA colour — "Add to Cart", "Checkout", "Shop Now"
        secondary: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#d97706',  // Rich amber
          600: '#b45309',
          700: '#92400e',
          800: '#78350f',
          900: '#451a03',
        },
        // EARTH — Brown (authenticity, soil, farm-to-table)
        earth: {
          50:  '#faf6f2',
          100: '#f0e6d8',
          200: '#dfc9b0',
          300: '#c9a882',
          400: '#b08558',
          500: '#8B5E3C',  // Earth Brown
          600: '#704b30',
          700: '#553824',
          800: '#3a2518',
          900: '#1f120c',
        },
        // NEUTRAL — Warm, not cold (cream-tinted, not gray)
        neutral: {
          50:  '#FAFAF7',  // Warm off-white
          100: '#F5F4EE',  // Warm cream
          200: '#E8E6DC',  // Warm light
          300: '#D1CEC0',  // Warm mid
          400: '#A8A497',  // Warm gray
          500: '#77736A',  // Base warm gray
          600: '#55524A',  // Dark warm
          700: '#3D3B35',  // Darker warm
          800: '#28271F',  // Very dark
          900: '#16150F',  // Almost black
        },
        // ACCENT — kept as alias for backward compatibility with unredesigned components
        // These are the same mint green values; components will be updated in later tasks
        accent: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // SEMANTIC
        success: { 50: '#f0fdf4', 100: '#dcfce7', 500: '#22c55e', 600: '#16a34a' },
        warning: { 50: '#fffbeb', 500: '#f59e0b', 600: '#d97706' },
        error:   { 50: '#fef2f2', 500: '#ef4444', 600: '#dc2626' },
        info:    { 50: '#eff6ff', 500: '#3b82f6', 600: '#2563eb' },
      },

      fontFamily: {
        sans:     ['var(--font-poppins)', 'system-ui', 'sans-serif'],
        display:  ['var(--font-poppins)', 'system-ui', 'sans-serif'],
        body:     ['var(--font-poppins)', 'system-ui', 'sans-serif'],
        playfair: ['var(--font-playfair)', 'Georgia', 'serif'],
        urdu:     ['Noto Nastaliq Urdu', 'serif'],
      },

      fontSize: {
        'xs':   ['0.75rem',  { lineHeight: '1rem' }],
        'sm':   ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem',     { lineHeight: '1.5rem' }],
        'lg':   ['1.125rem', { lineHeight: '1.75rem' }],
        'xl':   ['1.25rem',  { lineHeight: '1.75rem' }],
        '2xl':  ['1.5rem',   { lineHeight: '2rem' }],
        '3xl':  ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl':  ['2.25rem',  { lineHeight: '2.5rem' }],
        '5xl':  ['3rem',     { lineHeight: '1' }],
        '6xl':  ['3.75rem',  { lineHeight: '1' }],
        '7xl':  ['4.5rem',   { lineHeight: '1' }],
      },

      spacing: {
        '18':  '4.5rem',
        '88':  '22rem',
        '128': '32rem',
      },

      borderRadius: {
        'xl':  '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },

      boxShadow: {
        // New semantic elevation scale
        'xs':             '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        'sm':             '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        'md':             '0 4px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
        'lg':             '0 8px 30px rgba(0,0,0,0.10), 0 4px 10px rgba(0,0,0,0.04)',
        'xl':             '0 20px 60px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.06)',
        'glow-primary':   '0 0 20px rgba(61, 122, 46, 0.25)',
        'glow-secondary': '0 0 20px rgba(217, 119, 6, 0.25)',
        // Legacy names — kept for backward compat with unredesigned components
        'soft':           '0 2px 15px -3px rgba(0,0,0,0.07), 0 10px 20px -2px rgba(0,0,0,0.04)',
        'medium':         '0 4px 25px -5px rgba(0,0,0,0.10), 0 10px 10px -5px rgba(0,0,0,0.04)',
        'strong':         '0 10px 40px -10px rgba(0,0,0,0.15), 0 4px 25px -5px rgba(0,0,0,0.10)',
        'glow':           '0 0 20px rgba(61, 122, 46, 0.30)',
        'glow-soft':      '0 0 15px rgba(61, 122, 46, 0.20)',
      },

      backgroundImage: {
        'organic-texture': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%233d7a2e' fill-opacity='0.04'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10S0 14.5 0 20s4.5 10 10 10 10-4.5 10-10zm0 0c0 5.5 4.5 10 10 10s10-4.5 10-10-4.5-10-10-10-10 4.5-10 10z'/%3E%3C/g%3E%3C/svg%3E\")",
      },

      animation: {
        'fade-in':    'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'bounce-slow':'bounce 2s infinite',
        'shimmer':    'shimmer 1.5s infinite',
      },

      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        shimmer: {
          'from': { backgroundPosition: '-200% 0' },
          'to':   { backgroundPosition:  '200% 0' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
