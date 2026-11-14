/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      borderRadius: {
        'container': '40px',
        'xl2': '28px',
        'lg2': '16px',
        'md2': '10px',
      },
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#0f172a',
        },
        luminous: {
          canvas: '#f8fafc',
          surface: '#ffffff',
          subtle: '#f1f5f9',
          border: '#e2e8f0',
          darkBg: '#090d16',
          darkSurface: '#111827',
          darkBorder: '#1f2937',
        },
        sentiment: {
          posBg: '#ecfdf5',
          posText: '#059669',
          posBorder: '#a7f3d0',
          negBg: '#fff1f2',
          negText: '#e11d48',
          negBorder: '#fecdd3',
          warnBg: '#fffbeb',
          warnText: '#d97706',
          warnBorder: '#fde68a',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -4px rgba(0, 0, 0, 0.02)',
        'elevated': '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
        'luminous': '0 0 25px -5px rgba(99, 102, 241, 0.15)',
      }
    },
  },
  plugins: [],
}
