import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Big Bang palette
        ink: '#0b0a08',        // darkest bg (home / nav)
        'ink-2': '#0f0d0a',    // page bg
        cream: '#f2ede3',      // primary text
        'cream-2': '#f6f1e7',
        accent: '#E8B84B',     // gold accent
        'accent-2': '#f2d3a8',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'serif'],
        mono: ['ui-monospace', 'Menlo', 'monospace'],
        // The "Atlas" wordmark — nav bar logo, Admin Panel sidebar, login screen.
        brand: ['"Uncial Antiqua"', 'cursive'],
      },
      keyframes: {
        bbDrift: {
          '0%': { transform: 'scale(1.05) translate(0,0)' },
          '100%': { transform: 'scale(1.12) translate(-1.6%,1.2%)' },
        },
        bbCardIn: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        bbFadeUp: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        bbFadeDown: {
          from: { opacity: '0', transform: 'translateY(-14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        bbFloat: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-7px)' },
        },
      },
      animation: {
        bbDrift: 'bbDrift 18s ease-in-out infinite alternate',
        bbCardIn: 'bbCardIn .5s ease both',
        bbFadeUp: 'bbFadeUp .6s ease both',
        bbFadeDown: 'bbFadeDown .6s ease both',
        bbFloat: 'bbFloat 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
