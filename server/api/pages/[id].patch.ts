import type { H3Event } from 'h3'
import { directusAdminFetch, getCurrentUserId } from '../../utils/directus'

interface UpdatePageBody {
	name?: string
	password?: string
	partitureIds?: string[]
}

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

	const body = await readBody<UpdatePageBody>(event)
	const name = typeof body?.name === 'string' ? body.name.trim() : ''
	const password = typeof body?.password === 'string' ? body.password.trim() : ''
	const partitureIds = Array.isArray(body?.partitureIds)
		? body.partitureIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
		: []

	if (!name) {
		throw createError({ statusCode: 400, statusMessage: 'Name is required' })
	}

	const payload: Record<string, unknown> = {
		name,
		partitures: partitureIds.map((id) => ({ partiture_id: id }))
	}

	if (password) {
		payload.password = password
	}

	await directusAdminFetch(`/items/page/${pageId}`, {
		method: 'PATCH',
		body: payload
	})

	return { success: true }
}

export default defineEventHandler(handler)
