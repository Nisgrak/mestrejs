import { directusAdminFetch, getCurrentUserId } from '../../../utils/directus'
import { createSharePasswordHash } from '../../../utils/share-password'

type Visibility = 'private' | 'public' | 'password'

interface ShareBody {
	visibility?: Visibility
	password?: string
}

interface DirectusPartitureOwnerResponse {
	data?: {
		id: string
		user_created?: string | null
	}
}

export default defineEventHandler(async (event) => {
	const userId = await getCurrentUserId(event)
	if (!userId) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
	}

	const partitureId = getRouterParam(event, 'id')
	const body = await readBody<ShareBody>(event)
	const visibility = body?.visibility

	if (!partitureId) {
		throw createError({ statusCode: 400, statusMessage: 'Missing partiture id' })
	}

	if (!visibility || !['private', 'public', 'password'].includes(visibility)) {
		throw createError({ statusCode: 400, statusMessage: 'Invalid visibility value' })
	}

	let partiture: DirectusPartitureOwnerResponse

	try {
		partiture = await directusAdminFetch<DirectusPartitureOwnerResponse>(`/items/partiture/${partitureId}`, {
			query: {
				fields: 'id,user_created'
			}
		})
	} catch {
		throw createError({ statusCode: 404, statusMessage: 'Partiture not found' })
	}

	if (!partiture.data?.id) {
		throw createError({ statusCode: 404, statusMessage: 'Partiture not found' })
	}

	if (!partiture.data.user_created || partiture.data.user_created !== userId) {
		throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
	}

	const password = typeof body?.password === 'string' ? body.password.trim() : ''

	if (visibility === 'password' && !password) {
		throw createError({ statusCode: 400, statusMessage: 'Password required for password visibility' })
	}

	const item = visibility === 'password'
		? { visibility, share_password: await createSharePasswordHash(password) }
		: { visibility, share_password: null }

	await directusAdminFetch(`/items/partiture/${partitureId}`, {
		method: 'PATCH',
		body: {
			visibility: item.visibility,
			share_password: item.share_password
		}
	})

	return {
		success: true,
		visibility
	}
})
