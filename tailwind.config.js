/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'theme-bg': '#F7F8FA',
        'theme-surface': '#FFFFFF',
        'theme-primary': '#172033',
        'theme-primary-hover': '#25324A',
        'theme-accent': '#5865F2',
        'theme-accent-light': '#EEF0FF',
        'theme-secondary-accent': '#2A9D8F',
        'theme-text': '#1F2937',
        'theme-text-secondary': '#64748B',
        'theme-muted': '#94A3B8',
        'theme-border': '#E5E7EB',
        'theme-border-subtle': '#EEF0F3',
        
        'theme-present': '#16866A',
        'theme-present-bg': '#E9F7F2',
        'theme-absent': '#D9536F',
        'theme-absent-bg': '#FCECEF',
        'theme-late': '#C98A24',
        'theme-late-bg': '#FFF6DF',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.05)',
        'float': '0 10px 30px rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
}