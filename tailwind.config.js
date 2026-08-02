/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dong: 'var(--mau-dong)',
        ngoc: 'var(--mau-ngoc)',
        van: 'var(--mau-van)',
        hoi: 'var(--mau-hoi)',
        lam: 'var(--mau-lam)',
        tro: 'var(--mau-tro)',
      },
    },
  },
  plugins: [],
};
