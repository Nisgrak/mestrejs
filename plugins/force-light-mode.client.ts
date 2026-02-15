export default defineNuxtPlugin(() => {
	const colorMode = useColorMode()
	colorMode.preference = 'light'
})
