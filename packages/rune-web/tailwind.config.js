/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        rune: {
          50: '#f8fafc',
          100: '#f1f5f9',
          500: '#64748b',
          900: '#0f172a',
        },
      },
    },
  },
  plugins: [],
}