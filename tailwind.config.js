/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f7f3ec',
        mist: '#f5f6f2',
        ink: '#172033',
        forest: '#183f36',
        leaf: '#4f7b65',
        warm: '#d6b98d',
        sand: '#eee3d0',
      },
      boxShadow: {
        soft: '0 18px 50px rgba(23, 32, 51, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'Pretendard', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
