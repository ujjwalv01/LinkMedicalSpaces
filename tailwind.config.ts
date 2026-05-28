import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Overridden Slate for Navy Blue branding
        slate: {
          50: '#f3f6fa',
          100: '#e5ecf4',
          200: '#cfdceb',
          300: '#a8c2dc',
          400: '#7ba2ca',
          500: '#5985b5',
          600: '#436998',
          700: '#36537a',
          800: '#284880', // Main brand navy blue
          900: '#263b5f',
          950: '#192540',
        },
        // Overridden Teal for Crimson Red branding
        teal: {
          50: '#fdf3f4',
          100: '#fbe5e7',
          200: '#f5c3c8',
          300: '#ee929d',
          400: '#e55a6a',
          500: '#e03a4d',
          600: '#df2e42', // Main brand red
          700: '#bc2234',
          800: '#9b202e',
          900: '#811e29',
          950: '#460c13',
        },
        // Semantic aliases
        primary: {
          DEFAULT: '#df2e42',
          foreground: '#ffffff',
          50: '#fdf3f4',
          100: '#fbe5e7',
          200: '#f5c3c8',
          300: '#ee929d',
          400: '#e55a6a',
          500: '#e03a4d',
          600: '#df2e42',
          700: '#bc2234',
          800: '#9b202e',
          900: '#811e29',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
        'card-hover': '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
        'listing': '0 2px 8px 0 rgba(0,0,0,0.12)',
        'listing-hover': '0 8px 24px 0 rgba(0,0,0,0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
