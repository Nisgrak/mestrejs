// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	devtools: { enabled: true },

	hooks: {
		'pages:extend'(pages) {
			// add a route
			pages.push({
				name: 'index',
				path: '/',
				redirect: "/canvas"
			})
		}
	},

	typescript: {
		shim: false,
		strict: true,
		typeCheck: true
	},
	directus: {
		autoFetch: false
	},

	imports: {
		dirs: ['./stores'],
	},

	modules: ["nuxt-quasar-ui", '@pinia/nuxt', "@unocss/nuxt", "nuxt-directus", "@vite-pwa/nuxt"],
	pwa: {
		registerWebManifestInRouteRules: true,
		registerType: "autoUpdate",
		manifest: {
			name: "MestreJS",

			short_name: "MestreJS",
			description: "The place where brazilian music born",
			display: "standalone",
			orientation: "portrait",

			background_color: "#FAFAFA",

			theme_color: "#E47C44",
			icons: [
				{
					src: "logo-mestrejs.svg",
					sizes: "any",
				},
				{
					src: "icons/icon-128x128.png",
					sizes: "128x128",
					type: "image/png"
				},
				{
					src: "icons/icon-192x192.png",
					sizes: "192x192",
					type: "image/png"
				},
				{
					src: "icons/icon-256x256.png",
					sizes: "256x256",
					type: "image/png"
				},
				{
					src: "icons/icon-384x384.png",
					sizes: "384x384",
					type: "image/png"
				},
				{
					src: "icons/icon-512x512.png",
					sizes: "512x512",
					type: "image/png"
				},
				{
					src: "icons/maskable_icon_x512.png",
					sizes: "512x512",
					type: "image/png",
					purpose: "maskable"
				},
				{
					src: "icons/maskable_icon_x384.png",
					sizes: "384x384",
					type: "image/png",
					purpose: "maskable"
				},
				{
					src: "icons/maskable_icon_x192.png",
					sizes: "192x192",
					type: "image/png",
					purpose: "maskable"
				},
				{
					src: "icons/maskable_icon_x128.png",
					sizes: "128x128",
					type: "image/png",
					purpose: "maskable"
				},
				{
					src: "icons/maskable_icon_x96.png",
					sizes: "96x96",
					type: "image/png",
					purpose: "maskable"
				},
				{
					src: "icons/maskable_icon_x72.png",
					sizes: "72x72",
					type: "image/png",
					purpose: "maskable"
				},
				{
					src: "icons/maskable_icon_x48.png",
					sizes: "48x48",
					type: "image/png",
					purpose: "maskable"
				},
				{
					src: "icons/maskable_icon.png",
					type: "image/png",
					purpose: "maskable"
				},
			]

		}
	},
	quasar: {
		iconSet: "svg-mdi-v6",
		plugins: [
			"Notify",
			"Dialog"
		],
		config: {
			brand: {
				primary: "#E47C44",
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
