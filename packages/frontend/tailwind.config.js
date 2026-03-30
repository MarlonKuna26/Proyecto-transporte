/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8f0fe',
          100: '#c5d9fc',
          200: '#9ebef9',
          300: '#77a3f7',
          400: '#5a8ff5',
          500: '#1a56db',
          600: '#1648c0',
          700: '#123a9e',
          800: '#0e2d7d',
          900: '#0a205c',
          950: '#06153d',
        },
        navy: {
          50: '#e8ecf4',
          100: '#c4cde3',
          200: '#9dacd0',
          300: '#768bbd',
          400: '#5973ae',
          500: '#1e3a5f',
          600: '#1a3354',
          700: '#152b48',
          800: '#0f1f35',
          900: '#0b1628',
          950: '#060d18',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(10, 32, 92, 0.15)',
        'card': '0 4px 24px -1px rgba(0, 0, 0, 0.06), 0 2px 8px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 12px 40px -8px rgba(10, 32, 92, 0.15), 0 4px 12px -2px rgba(0, 0, 0, 0.06)',
        'glow': '0 0 24px rgba(26, 86, 219, 0.25)',
        'blue': '0 4px 14px rgba(26, 86, 219, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
