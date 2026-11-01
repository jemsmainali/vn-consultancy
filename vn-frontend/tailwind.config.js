const INTER = ['"Inter Variable"', 'Inter', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif']

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
        serif: INTER,
        sans: INTER,
      },
    },
  },
  plugins: [],
}
