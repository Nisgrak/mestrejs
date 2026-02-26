import { directusAdminFetch, getCurrentUserId } from '../utils/directus'
import type { H3Event } from 'h3'

interface DirectusPartitureItem {
	id: string
	name: string
	bpm: number
	song?: unknown
	visibility?: 'private' | 'public' | 'password' | null
	user_created?: string | null
	date_updated?: string
}

interface DirectusListResponse {
	data?: DirectusPartitureItem[]
}

interface PartitureListRow {
	id: string
	name: string
	bpm: number
	song?: unknown
	visibility: 'private' | 'public' | 'password' | null
	user_created: string | null
	date_updated?: string
}

const handler = async (event: H3Event): Promise<PartitureListRow[]> => {
	const userId = await getCurrentUserId(event)
	if (!userId) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
	}

	const response: DirectusListResponse = await directusAdminFetch<DirectusListResponse>('/items/partiture', {
		query: {
			fields: 'id,name,bpm,song,visibility,user_created,date_updated',
			filter: {
				user_created: {
					_eq: userId
				}
			},
			sort: '-date_updated',
			limit: 300
		}
	})

	return (response.data ?? []).map((item) => ({
		id: item.id,
		name: item.name,
		bpm: item.bpm,
		song: item.song,
		visibility: item.visibility ?? null,
		user_created: item.user_created ?? null,
		date_updated: item.date_updated
	}))
}

export default defineEventHandler(handler)
