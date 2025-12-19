import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'uno-red': '#ED1C24',
        'uno-blue': '#0072BC',
        'uno-green': '#00A651',
        'uno-yellow': '#FFED00',
        'uno-black': '#1a1a1a',
        'card-shadow': 'rgba(0,0,0,0.4)',
      },
      boxShadow: {
        'card': '0 4px 8px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)',
        'card-hover': '0 8px 16px rgba(0,0,0,0.4), 0 4px 8px rgba(0,0,0,0.3)',
        'glow-red': '0 0 20px rgba(237, 28, 36, 0.5)',
        'glow-blue': '0 0 20px rgba(0, 114, 188, 0.5)',
        'glow-green': '0 0 20px rgba(0, 166, 81, 0.5)',
        'glow-yellow': '0 0 20px rgba(255, 237, 0, 0.5)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'card-deal': 'cardDeal 0.4s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        cardDeal: {
          '0%': { transform: 'translateY(-100px) rotate(-10deg)', opacity: '0' },
          '100%': { transform: 'translateY(0) rotate(0)', opacity: '1' },
        },
      },
      fontFamily: {
        'uno': ['Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
