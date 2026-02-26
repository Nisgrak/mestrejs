import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

export default defineConfig({
	test: {
		projects: [
			{
				test: {
					name: 'unit',
					include: ['test/unit/**/*.test.ts'],
					environment: 'node',
					testTimeout: 30000
				}
			},
			await defineVitestProject({
				test: {
					name: 'nuxt',
					include: ['test/nuxt/**/*.test.ts'],
					environment: 'nuxt'
				}
			})
		]
	}
})
