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
        // Khaalis Harvest Organic Color Palette
        primary: {
          50: '#f0f9f0',   // Lightest mint
          100: '#dcf2dc',  // Very light mint
          200: '#b8e5b8',  // Light mint
          300: '#94d894',  // Soft mint
          400: '#70cb70',  // Medium mint
          500: '#4B8B3B',  // Leaf Green - Main brand color
          600: '#3d7030',  // Darker leaf
          700: '#2f5525',  // Deep leaf
          800: '#213a1a',  // Darkest leaf
          900: '#131f0f',  // Almost black leaf
        },
        secondary: {
          50: '#faf8f6',   // Lightest cream
          100: '#f5f0eb',  // Very light cream
          200: '#ebe1d6',  // Light cream
          300: '#e1d2c1',  // Soft cream
          400: '#d7c3ac',  // Medium cream
          500: '#8B5E3C',  // Earth Brown - Secondary brand color
          600: '#704b30',  // Darker earth
          700: '#553824',  // Deep earth
          800: '#3a2518',  // Darkest earth
          900: '#1f120c',  // Almost black earth
        },
        accent: {
          50: '#f0fdf4',   // Lightest fresh
          100: '#dcfce7',  // Very light fresh
          200: '#bbf7d0',  // Light fresh
          300: '#86efac',  // Soft fresh
          400: '#4ade80',  // Medium fresh
          500: '#22c55e',  // Fresh Mint Green
          600: '#16a34a',  // Darker fresh
          700: '#15803d',  // Deep fresh
          800: '#166534',  // Darkest fresh
          900: '#14532d',  // Almost black fresh
        },
        neutral: {
          50: '#fafafa',   // Clean White
          100: '#f5f5f5',  // Off white
          200: '#e5e5e5',  // Light gray
          300: '#d4d4d4',  // Soft gray
          400: '#a3a3a3',  // Medium gray
          500: '#737373',  // Base gray
          600: '#525252',  // Dark gray
          700: '#404040',  // Darker gray
          800: '#262626',  // Very dark gray
          900: '#171717',  // Almost black
        },
        // Semantic colors
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
        info: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'Open Sans', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
        body: ['Open Sans', 'system-ui', 'sans-serif'],
        urdu: ['Noto Nastaliq Urdu', 'serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'strong': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 4px 25px -5px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 20px rgba(75, 139, 59, 0.3)',
        'glow-soft': '0 0 15px rgba(75, 139, 59, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
