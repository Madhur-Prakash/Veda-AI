import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        ink: '#1f1f1f',
        mist: '#f5f5f4',
        shell: '#fbfbfa',
        line: '#e8e5e3',
        accent: {
          DEFAULT: '#ff6a2b',
          soft: '#ffefe6'
        }
      },
      boxShadow: {
        soft: '0 18px 60px rgba(0, 0, 0, 0.12)',
        card: '0 8px 24px rgba(0, 0, 0, 0.06)'
      },
      borderRadius: {
        xl2: '1.5rem'
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'ui-sans-serif', 'system-ui'],
        display: ['var(--font-space-grotesk)', 'ui-sans-serif', 'system-ui']
      },
      backgroundImage: {
        'soft-radial': 'radial-gradient(circle at top left, rgba(255,255,255,0.85), rgba(245,245,245,0.9) 32%, rgba(230,230,230,0.9) 100%)'
      }
    }
  },
  plugins: []
};

export default config;