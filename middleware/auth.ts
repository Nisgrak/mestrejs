export default defineNuxtRouteMiddleware(async () => {
	const songStore = useSongStore()
	const { token, refreshToken, token_expired, refreshTokens } = useDirectusToken()
	const { fetchUser } = useDirectusAuth()

	if (refreshToken.value && (!token.value || token_expired.value)) {
		try {
			await refreshTokens()
		} catch {
			return navigateTo({ name: 'LoginPage' })
		}
	}

	if (!token.value) {
		return navigateTo({ name: 'LoginPage' })
	}

	if (!songStore.user) {
		await fetchUser()
		const user = useDirectusUser().value
		if (!user) {
			return navigateTo({ name: 'LoginPage' })
		}

		songStore.user = user
	}
})
