// uno.config.ts
import { defineConfig, presetWind } from 'unocss'
import transformerDirectives from '@unocss/transformer-directives'

export default defineConfig({
	presets: [presetWind()],
	safelist: [
		'lg:grid-cols-2',
		'lg:grid-cols-4'
	],
	transformers: [
		transformerDirectives(),
	],
})
