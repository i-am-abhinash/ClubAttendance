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
          bg: '#F7F8FA',
          surface: '#FFFFFF',
          primary: '#172033',
          accent: '#5865F2',
          'accent-light': '#EEF0FF',
          'secondary-teal': '#2A9D8F',
          text: '#1F2937',
          'text-secondary': '#64748B',
          muted: '#94A3B8',
          border: '#E5E7EB',
          'border-subtle': '#F1F5F9',
          
          present: '#16866A',
          'present-bg': '#E9F7F2',
          
          absent: '#D9536F',
          'absent-bg': '#FCECEF',
          
          late: '#C98A24',
          'late-bg': '#FFF6DF',
        }
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'float': '0 8px 30px rgba(0, 0, 0, 0.08)',
        'nav': '0 0 40px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
