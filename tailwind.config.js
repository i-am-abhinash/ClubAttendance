/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          bg: 'var(--bg)',
          surface: 'var(--surface)',
          'surface-2': 'var(--surface-2)',
          ink: 'var(--ink)',
          'ink-muted': 'var(--ink-muted)',
          line: 'var(--line)',
          'accent-a': 'var(--accent-a)',
          'accent-b': 'var(--accent-b)',
          'accent-c': 'var(--accent-c)',
          glow: 'var(--glow)',
          down: '#ef4444' 
        }
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        none: 'none',
        glow: '0 0 24px var(--glow)',
      }
    },
  },
  plugins: [],
}
