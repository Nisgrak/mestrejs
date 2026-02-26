import type { H3Event } from 'h3'
import { directusAdminFetch, getCurrentUserId } from '../utils/directus'

interface DirectusPageRelation {
	partiture_id?: string | { id?: string } | null
}

interface DirectusPageItem {
	id: string
	name: string
	partitures?: DirectusPageRelation[]
}

interface DirectusPageListResponse {
	data?: DirectusPageItem[]
}

interface PageListItem {
	id: string
	name: string
	partitures: { partiture_id: string }[]
}

function normalizePartitureId(relation: DirectusPageRelation) {
	if (!relation.partiture_id) {
		return null
	}

	if (typeof relation.partiture_id === 'string') {
		return relation.partiture_id
	}

	return relation.partiture_id.id ?? null
}

const handler = async (event: H3Event): Promise<PageListItem[]> => {
	const userId = await getCurrentUserId(event)
	if (!userId) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
	}

	const response = await directusAdminFetch<DirectusPageListResponse>('/items/page', {
		query: {
			fields: 'id,name,partitures.partiture_id,user_created,date_updated',
			filter: {
				user_created: {
					_eq: userId
				}
			},
			sort: '-date_updated',
			limit: 200
		}
	})

	return (response.data ?? []).map((item) => ({
		id: item.id,
		name: item.name,
		partitures: (item.partitures ?? [])
			.map((relation) => normalizePartitureId(relation))
			.filter((id): id is string => Boolean(id))
			.map((id) => ({ partiture_id: id }))
	}))
}

export default defineEventHandler(handler)
