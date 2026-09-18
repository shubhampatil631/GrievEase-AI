/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          deep: '#070A12',
          base: '#0A0D14',
          surface: '#0F172A',
          overlay: '#141E33',
        },
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        indigo: {
          accent: '#6366F1',
          light: '#818CF8',
          glow: 'rgba(99, 102, 241, 0.4)',
        },
        cyan: {
          accent: '#06B6D4',
          light: '#22D3EE',
          glow: 'rgba(6, 182, 212, 0.4)',
        },
        emerald: {
          pulse: '#10B981',
          light: '#34D399',
          glow: 'rgba(16, 185, 129, 0.4)',
        },
        rose: {
          sunset: '#F43F5E',
          light: '#FB7185',
          glow: 'rgba(244, 63, 94, 0.4)',
        },
        aws: {
          orange: '#FF9900',
          dark: '#232F3E',
          squid: '#1A242F',
          blue: '#0073BB',
        },
        surface: {
          950: '#05080E',
          900: '#0A0D14',
          850: '#0F1626',
          800: '#131C31',
          750: '#19243E',
          700: '#202E4E',
          600: '#33446B',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-teal': '0 0 25px -5px rgba(20, 184, 166, 0.45)',
        'glow-cyan': '0 0 30px -5px rgba(6, 182, 212, 0.45)',
        'glow-indigo': '0 0 30px -5px rgba(99, 102, 241, 0.45)',
        'glow-rose': '0 0 25px -5px rgba(244, 63, 94, 0.45)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.45)',
        'glow-aws': '0 0 25px -5px rgba(255, 153, 0, 0.4)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'bento': '0 10px 40px -10px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(255, 255, 255, 0.08)',
        'bento-hover': '0 20px 50px -12px rgba(20, 184, 166, 0.25), 0 0 1px 1px rgba(20, 184, 166, 0.4)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 14s linear infinite',
        'shimmer': 'shimmer 2.5s infinite linear',
        'radar': 'radar 2s cubic-bezier(0, 0.2, 0.8, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        radar: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
      }
    },
  },
  plugins: [],
}
