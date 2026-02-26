export default defineNuxtRouteMiddleware(async () => {
	const songStore = useSongStore()
	const { token } = useDirectusToken()

	if (!token.value) {
		return navigateTo({ name: 'LoginPage' })
	}

	if (!songStore.user) {
		const user = (await useDirectusUser()).value
		if (!user) {
			return navigateTo({ name: 'LoginPage' })
		}

		songStore.user = user
	}
})
