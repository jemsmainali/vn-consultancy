export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: { DEFAULT: '#F6F8FC', deep: '#E9EEF5' },
        navy: { DEFAULT: '#102544', 700: '#19395F' },
        gold: { DEFAULT: '#C9A45C', deep: '#A98543' },
        ink: '#202938',
      },
      fontFamily: {
        serif: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'SF Pro Display', 'Segoe UI', 'sans-serif'],
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'SF Pro Display', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
