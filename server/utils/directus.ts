import type { H3Event } from 'h3'

interface DirectusMeResponse {
	data?: {
		id?: string
	}
}

function getDirectusUrl() {
	const config = useRuntimeConfig()
	const directusUrl = config.public.directus?.url

	if (!directusUrl) {
		throw createError({ statusCode: 500, statusMessage: 'Directus URL not configured' })
	}

	return directusUrl
}

export function getDirectusServerToken() {
	const config = useRuntimeConfig() as { directusServerToken?: string }

	if (!config.directusServerToken) {
		throw createError({ statusCode: 500, statusMessage: 'Directus server token not configured' })
	}

	return config.directusServerToken
}

function getAccessTokenFromRequest(event: H3Event) {
	const config = useRuntimeConfig() as { directus?: { cookieNameToken?: string } }
	const cookieName = config.directus?.cookieNameToken ?? 'directus_token'
	const bearer = getHeader(event, 'authorization')

	if (bearer?.startsWith('Bearer ')) {
		return bearer.slice(7)
	}

	return getCookie(event, cookieName) ?? null
}

export async function getCurrentUserId(event: H3Event) {
	const token = getAccessTokenFromRequest(event)
	if (!token) {
		return null
	}

	try {
		const directusUrl = getDirectusUrl()
		const response = await $fetch<DirectusMeResponse>(`${directusUrl}/users/me`, {
			headers: {
				Authorization: `Bearer ${token}`
			},
			query: {
				fields: 'id'
			}
		})

		return response.data?.id ?? null
	} catch {
		return null
	}
}

export async function directusAdminFetch<T>(path: string, options?: Parameters<typeof $fetch<T>>[1]) {
	const directusUrl = getDirectusUrl()
	const adminToken = getDirectusServerToken()

	return await $fetch<T>(`${directusUrl}${path}`, {
		...options,
		headers: {
			Authorization: `Bearer ${adminToken}`,
			...(options?.headers ?? {})
		}
	})
}
