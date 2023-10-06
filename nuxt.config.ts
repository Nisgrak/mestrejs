// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  typescript: {
    shim: false,
    strict: true,
    typeCheck: true
  },
  directus: {
    autoFetch: false
  },

  pinia: {
    autoImports: ['defineStore', 'acceptHMRUpdate'],
  },

  imports: {
    dirs: ['./stores'],
  },

  modules: ["nuxt-quasar-ui", '@pinia/nuxt', "@unocss/nuxt", "nuxt-directus"],
  quasar: {
    iconSet: "svg-mdi-v6",
    plugins: [
      "Notify",
      "Dialog"
    ],
    config: {
      brand: {
        primary: "#e3773c",
        secondary: "#26a69a",
        accent: "#424242",

        dark: "#1D1D1D",

        positive: "#4caf50",
        negative: "#f44336",
        info: "#2196f3",
        warning: "#ffeb3b",

      }
    }
  }
})
