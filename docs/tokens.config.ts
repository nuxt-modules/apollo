import { defineThemeTokens, palette } from '@nuxt-themes/kit'

console.log(palette('purple'))
export default defineThemeTokens({
  colors: {
    primary: palette('purple')
  }
})
