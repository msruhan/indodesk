import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        // Refined emerald-jade palette tuned for premium light mode
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        accent: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
        // Neutral scale tuned for premium readability on white
        surface: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        ink: {
          DEFAULT: '#0a0a0a',
          soft: '#1a1a1a',
          muted: '#52525b',
        },
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
        display: ['var(--font-cabinet)', 'var(--font-outfit)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        'tight-lg': '-0.022em',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        // Premium layered shadow system (light-mode tuned)
        'soft-xs': '0 1px 2px rgba(15, 23, 42, 0.04), 0 0 0 1px rgba(15, 23, 42, 0.04)',
        'soft-sm': '0 2px 6px -1px rgba(15, 23, 42, 0.05), 0 0 0 1px rgba(15, 23, 42, 0.04)',
        'soft-md': '0 8px 24px -8px rgba(15, 23, 42, 0.08), 0 2px 6px -2px rgba(15, 23, 42, 0.04)',
        'soft-lg': '0 24px 48px -16px rgba(15, 23, 42, 0.12), 0 8px 16px -8px rgba(15, 23, 42, 0.06)',
        'soft-xl': '0 40px 80px -24px rgba(15, 23, 42, 0.18), 0 16px 32px -12px rgba(15, 23, 42, 0.08)',
        'soft-2xl': '0 60px 120px -32px rgba(15, 23, 42, 0.22), 0 24px 48px -16px rgba(15, 23, 42, 0.1)',
        'glow-primary': '0 24px 60px -20px rgba(16, 185, 129, 0.4)',
        'glow-primary-lg': '0 40px 100px -28px rgba(16, 185, 129, 0.5)',
        'glow-accent': '0 24px 60px -20px rgba(8, 145, 178, 0.35)',
        'inner-soft': 'inset 0 1px 1px rgba(255, 255, 255, 0.6), inset 0 -1px 1px rgba(15, 23, 42, 0.04)',
        'ring-primary': '0 0 0 1px rgba(16, 185, 129, 0.18), 0 8px 24px -8px rgba(16, 185, 129, 0.18)',
      },
      transitionTimingFunction: {
        // Premium easings inspired by Linear/Apple/Framer
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
        'out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'in-out-quart': 'cubic-bezier(0.76, 0, 0.24, 1)',
        spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        250: '250ms',
        350: '350ms',
        450: '450ms',
        600: '600ms',
        900: '900ms',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'slide-in': 'slideIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        float: 'float 7s ease-in-out infinite',
        'float-slow': 'float 11s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        aurora: 'aurora 18s ease-in-out infinite',
        'aurora-fast': 'aurora 12s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        marquee: 'marquee 40s linear infinite',
        'marquee-slow': 'marquee 70s linear infinite',
        'gradient-flow': 'gradientFlow 9s ease-in-out infinite',
        'spin-slow': 'spin 18s linear infinite',
        'glow-pulse': 'glowPulse 3.6s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -16px, 0)' },
        },
        aurora: {
          '0%, 100%': { transform: 'translate3d(0%, 0%, 0) rotate(0deg)', opacity: '0.55' },
          '50%': { transform: 'translate3d(3%, -3%, 0) rotate(8deg)', opacity: '0.85' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        gradientFlow: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '0.95', transform: 'scale(1.06)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      backdropBlur: {
        '2xs': '2px',
        xs: '4px',
      },
    },
  },
  plugins: [],
}
export default config
