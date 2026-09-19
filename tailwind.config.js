/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        theme: {
          bg: '#070B12',
          surface: '#0D1420',
          'surface-elevated': '#111B2A',
          'surface-higher': '#162235',
          primary: '#F1F5F9',
          accent: '#6D7CFF',
          'accent-hover': '#8190FF',
          'accent-light': 'rgba(109, 124, 255, 0.1)',
          cyan: '#38BDF8',
          text: '#F1F5F9',
          'text-secondary': '#94A3B8',
          muted: '#64748B',
          border: '#1E2A3A',
          'border-subtle': '#162131',
          
          present: '#34D399',
          'present-bg': 'rgba(52, 211, 153, 0.1)',
          
          absent: '#FB7185',
          'absent-bg': 'rgba(251, 113, 133, 0.1)',
          
          late: '#FBBF24',
          'late-bg': 'rgba(251, 191, 36, 0.1)',
        }
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.3)',
        'float': '0 8px 30px rgba(0, 0, 0, 0.4)',
        'nav': '0 0 40px rgba(0, 0, 0, 0.5)',
        'glow': '0 0 15px rgba(109, 124, 255, 0.2)',
      }
    },
  },
  plugins: [],
}
