import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#5b3a8e',
          light: '#8a6fc0',
          dark: '#3d2661',
        },
      },
    },
  },
  plugins: [],
};
export default config;
