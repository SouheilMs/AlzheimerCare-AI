import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: '#F4F7FB',
        sidebar: '#F8FBFF',
        surface: '#FFFFFF',
        'surface-soft': '#F1F7FF',
        border: '#DCE6F4',
        text: {
          DEFAULT: '#1F2A44',
          muted: '#6F7C91',
          soft: '#8D98A9',
        },
        brand: {
          blue: '#2F80ED',
          'blue-soft': '#E9F2FF',
          teal: '#20B5AE',
          'teal-soft': '#E8F8F6',
          amber: '#F2B35C',
          'amber-soft': '#FFF5E7',
          rose: '#EF6B73',
          'rose-soft': '#FFECEE',
          indigo: '#4664E8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '10px',
        md: '14px',
        lg: '18px',
        xl: '22px',
      },
      boxShadow: {
        card: '0 8px 24px rgba(37, 79, 145, 0.08)',
        soft: '0 4px 14px rgba(37, 79, 145, 0.06)',
      },
      spacing: {
        18: '4.5rem',
      },
      gridTemplateColumns: {
        dashboard: 'repeat(12, minmax(0, 1fr))',
      },
    },
  },
  plugins: [],
}

export default config
