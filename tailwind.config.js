/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ═══════════════════════════════════════════════════════════════
      //  PASTEL RETRO TERMINAL - COLOR SYSTEM
      //  VaultAgent Primary: Mint (#a8d8b9)
      // ═══════════════════════════════════════════════════════════════
      colors: {
        // Base colors - Dark with subtle green/mint warmth
        terminal: {
          bg: '#141a17',
          'bg-light': '#1a211d',
          'bg-dark': '#101512',
        },
        // Text colors
        text: {
          primary: '#e8e3e3',
          secondary: '#a8b2c3',
          muted: '#6e6a86',
        },
        // Accent colors (shared palette)
        accent: {
          cyan: '#7eb8da',      // RegexGPT
          mint: '#a8d8b9',      // VaultAgent (PRIMARY)
          lavender: '#c4a7e7',  // ShipLog / Pro features
          rose: '#f2cdcd',      // Cursors / highlights
          cream: '#ffe9b0',     // ErrorStory
          peach: '#f5a97f',     // DeadCode Detective
          coral: '#eb6f92',     // PRoast / Errors
        },
        // Semantic colors
        success: '#a8d8b9',
        error: '#eb6f92',
        warning: '#ffe9b0',
        info: '#7eb8da',
        pro: '#c4a7e7',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', 'monospace'],
      },
      animation: {
        'cursor-blink': 'blink 1.06s step-end infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
