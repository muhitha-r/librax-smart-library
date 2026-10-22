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
        forest: {
          950: '#081C15', // Deep Pine
          900: '#143527',
          800: '#1B4332', // Deep Forest Pine (Primary/Header/Sidebar)
          700: '#2D6A4F',
          600: '#40916C',
          500: '#52B788',
          100: '#D8F3DC',
          50: '#EBF7EE',
        },
        sand: {
          50: '#FFFFFF',
          100: '#F9F9F6', // Soft Cream / Alabaster (Page Background)
          200: '#F3F4F0',
          300: '#E5E7EB', // Subtle Border
          400: '#D1D5DB',
        },
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706', // Warm Amber (Primary Accent/Buttons)
          700: '#B45309', // Hover state
          800: '#92400E',
          900: '#78350F',
          DEFAULT: '#D97706',
        },
        charcoal: {
          DEFAULT: '#1F2937', // Headings / Main Text
          900: '#111827',
          800: '#1F2937',
          700: '#374151',
        },
        sage: {
          DEFAULT: '#6B7280', // Secondary Text
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
        },
        border: {
          subtle: '#E5E7EB',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
