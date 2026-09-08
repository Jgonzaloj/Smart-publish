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
        // Fondo de página y tarjetas — tema claro
        canvas: '#F5F7FA',
        surface: {
          DEFAULT: '#FFFFFF',
          raised: '#EFF6F1', // tinte sutil hacia el teal
        },
        borderc: '#E2E9E4',

        // Texto
        text: {
          primary: '#101828',
          secondary: '#667085',
        },

        // Acento principal (CTA, nav activo) — teal
        accent: {
          DEFAULT: '#12B76A',
          hover: '#0F6E56',
        },

        // Acento secundario — coral, para distinguir estados del teal
        coral: {
          DEFAULT: '#D85A30',
          hover: '#B84A26',
        },

        // Semánticos
        success: '#12B76A',
        warning: '#F79009',
        danger: '#F04438',
        purple: '#7A5AF8', // reservado para IA

        // Legacy: recoloreado de azul cielo a teal para que Composer/Login/Settings/etc.
        // (aún sin migrar al sistema de tokens nuevo) hereden la nueva dirección visual
        brand: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#12B76A',
          600: '#0F9D63',
          700: '#0F6E56',
          800: '#065F46',
          900: '#064E3B',
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
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
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
