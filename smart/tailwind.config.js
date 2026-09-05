/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Usaremos la clase 'dark' en el html para activarlo
  theme: {
    extend: {
      colors: {
        canvas: '#0F1115',
        surface: {
          DEFAULT: '#171A21',
          raised: '#1E222B',
        },
        borderc: '#2A2F3A',
        accent: {
          DEFAULT: '#6366F1',
          hover: '#7B7EF5',
        },
        success: '#34C77B',
        warning: '#F0A93E',
        danger: '#EF5350',
        purple: {
          DEFAULT: '#8B5CF6',
          hover: '#9D74FF',
        },
        'text-primary': '#FFFFFF',
        'text-secondary': '#94A3B8',
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Primary brand color
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        dark: {
          bg: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          text: '#f8fafc',
          textMuted: '#94a3b8'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
