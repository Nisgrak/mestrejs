import type { H3Event } from 'h3'
import { directusAdminFetch, getCurrentUserId } from '../utils/directus'

interface CreatePageBody {
	name?: string
	password?: string
	partitureIds?: string[]
}

const handler = async (event: H3Event) => {
	const userId = await getCurrentUserId(event)
	if (!userId) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
	}

	const body = await readBody<CreatePageBody>(event)
	const name = typeof body?.name === 'string' ? body.name.trim() : ''
	const password = typeof body?.password === 'string' ? body.password.trim() : ''
	const partitureIds = Array.isArray(body?.partitureIds)
		? body.partitureIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
		: []

	if (!name) {
		throw createError({ statusCode: 400, statusMessage: 'Name is required' })
	}

	await directusAdminFetch('/items/page', {
		method: 'POST',
		body: {
			name,
			password: password || null,
			partitures: partitureIds.map((id) => ({ partiture_id: id }))
		}
	})

	return { success: true }
}

export default defineEventHandler(handler)
