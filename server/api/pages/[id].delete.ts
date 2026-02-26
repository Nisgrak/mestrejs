import type { H3Event } from 'h3'
import { directusAdminFetch, getCurrentUserId } from '../../utils/directus'

interface DirectusPageOwnerResponse {
	data?: {
		id: string
		user_created?: string | null
	}
}

const handler = async (event: H3Event) => {
	const userId = await getCurrentUserId(event)
	if (!userId) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
	}

	const pageId = getRouterParam(event, 'id')
	if (!pageId) {
		throw createError({ statusCode: 400, statusMessage: 'Missing page id' })
	}

	let page: DirectusPageOwnerResponse

	try {
		page = await directusAdminFetch<DirectusPageOwnerResponse>(`/items/page/${pageId}`, {
			query: {
				fields: 'id,user_created'
			}
		})
	} catch {
		throw createError({ statusCode: 404, statusMessage: 'Page not found' })
	}

	if (!page.data?.id) {
		throw createError({ statusCode: 404, statusMessage: 'Page not found' })
	}

	if (!page.data.user_created || page.data.user_created !== userId) {
		throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
	}

	await directusAdminFetch(`/items/page/${pageId}`, {
		method: 'DELETE'
	})

	return { success: true }
}

export default defineEventHandler(handler)
