import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  extends: ['@nuxt-themes/docus'],

  colorMode: {
    preference: 'dark'
  },

  tailwindcss: {
    config: {
      important: true,
      theme: {
        extend: {
          colors: {
            primary: {
              100: '#F3E8FF',
              200: '#E9D5FF',
              300: '#D8B4FE',
              400: '#C084FC',
              500: '#A855F7',
              600: '#9333EA',
              700: '#7E22CE',
              800: '#6B21A8',
              900: '#581C87'
            }
          }
        }
      }
    }
  }

})
