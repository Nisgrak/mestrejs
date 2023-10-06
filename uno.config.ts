// uno.config.ts
import { defineConfig, presetWind } from 'unocss'
import transformerDirectives from '@unocss/transformer-directives'

export default defineConfig({
    presets: [presetWind()],
    safelist: [
		'md:grid-cols-2',
		'md:grid-cols-4'
	],
	 transformers: [
    transformerDirectives(),
  ],
})