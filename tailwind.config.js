module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        '8am': {
          'orange': '#ff3c03',
          'black': '#1d1d1f',
          'white': '#fff',
          'light-white': '#fbfafa',
          'grey': '#5a5a5a',
          'blue': '#3f72e3',
          'middle-grey': '#86868b',
          'middle-grey-hover': '#e1e1e1',
          'light-grey': '#e9e9e9',
          'light-blue': '#d3f0fe',
          'light-green': '#a7dc73',
          'light-yellow': '#ffee87',
          'light-orange': '#ef7e4e',
          'bg-beige': '#f6f4ee',
          'light-grey-2': '#c4c4c4',
          'light-grey-3': '#f5f5f5',
          'gray': '#A3A3A3',
          'light-grey-4': '#e0e0e0',
        },
        icon: {
          'sad': '#ff4d4f',
          'happy': '#52c41a',
        }
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        }
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
      }
    }
  },
  plugins: [],
};
