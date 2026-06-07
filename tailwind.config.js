/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#F5F3EE',
          100: '#EAE6DC',
          200: '#D4CDBF',
          500: '#6B5E4A',
          700: '#3D3228',
          900: '#1A1410',
        },
        gold: {
          50:  '#FBF5E4',
          200: '#E8D08A',
          500: '#8B6914',
          700: '#5C4509',
        },
      },
    },
  },
  plugins: [],
}
