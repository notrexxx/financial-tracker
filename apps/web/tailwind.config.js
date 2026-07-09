/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#020617', // slate-950
        surface: '#0f172a', // slate-900
        border: '#1e293b', // slate-800
        primary: '#3b82f6', // blue-500
        income: '#10b981', // emerald-500
        expense: '#ef4444', // red-500
        textMain: '#f8fafc', // slate-50
        textMuted: '#94a3b8', // slate-400
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}