/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
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
          bg: 'var(--color-bg)',
          'bg-secondary': 'var(--color-bg-secondary)',
          surface: 'var(--color-surface)',
          'surface-secondary': 'var(--color-surface-secondary)',
          border: 'var(--color-border)',
          
          text: 'var(--color-text)',
          'text-secondary': 'var(--color-text-secondary)',
          muted: 'var(--color-muted)',
          
          accent: 'var(--color-accent)',
          button: 'var(--color-button)',
          'button-text': 'var(--color-button-text)',
          
          present: 'var(--color-present)',
          'present-bg': 'var(--color-present-bg)',
          absent: 'var(--color-absent)',
          'absent-bg': 'var(--color-absent-bg)',
          late: 'var(--color-late)',
          'late-bg': 'var(--color-late-bg)',
          
          cyan: 'var(--color-cyan)',
        }
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(0,0,0,0.05)',
        'md': '0 4px 12px rgba(0,0,0,0.08)',
        'float': '0 10px 25px rgba(0, 0, 0, 0.1)',
        'nav': '0 0 40px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
