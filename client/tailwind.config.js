/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        batman: {
          black: '#050505',
          card: '#121212',
          yellow: '#FFD700',
          yellowDim: '#b8971a',
          surface: '#1a1a1a',
          border: '#2a2a2a',
          muted: '#555555',
          text: '#e0e0e0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Bebas Neue', 'Impact', 'sans-serif'],
      },
      boxShadow: {
        yellow: '0 0 20px rgba(255, 215, 0, 0.4)',
        yellowSm: '0 0 10px rgba(255, 215, 0, 0.25)',
        yellowLg: '0 0 40px rgba(255, 215, 0, 0.6)',
        card: '0 8px 32px rgba(0, 0, 0, 0.8)',
      },
      backgroundImage: {
        'bat-gradient':
          'radial-gradient(ellipse at center, #1a1200 0%, #0a0800 40%, #050505 100%)',
        'bat-signal':
          'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,215,0,0.08) 0%, transparent 70%)',
        'card-gradient':
          'linear-gradient(135deg, rgba(255,215,0,0.05) 0%, rgba(18,18,18,0) 100%)',
      },
      keyframes: {
        pulse_glow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(255,215,0,0.3)' },
          '50%': { boxShadow: '0 0 35px rgba(255,215,0,0.7)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        pulse_glow: 'pulse_glow 2.5s ease-in-out infinite',
        float: 'float 4s ease-in-out infinite',
        shimmer: 'shimmer 3s linear infinite',
      },
    },
  },
  plugins: [],
}
