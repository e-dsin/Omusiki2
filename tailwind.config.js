/** @type {import('tailwindcss').Config} */
module.exports = {
  // Avec Vite, index.html est à la racine du projet (et non plus dans public/)
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // Preflight désactivé : les composants existants sont stylés en ligne et n'ont pas été
  // conçus avec la remise à zéro Tailwind ; les utilitaires restent disponibles.
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        primary: {
          purple: '#8B5CF6',
          pink: '#EC4899',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to right, #8B5CF6, #EC4899)',
      },
    },
  },
  plugins: [],
};
