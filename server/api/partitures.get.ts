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

interface DirectusPartitureUsageAggregateRow {
	partiture_id?: string | { id?: string } | null
	count?: number | string | Record<string, number | string | null | undefined> | null
}

interface DirectusPartitureUsageAggregateResponse {
	data?: DirectusPartitureUsageAggregateRow[]
}

interface PartitureListRow {
	id: string
	name: string
	bpm: number
	song?: unknown
	visibility: 'private' | 'public' | 'password' | null
	user_created: string | null
	date_updated?: string
	page_count: number
}

function normalizePartitureId(value: string | { id?: string } | null | undefined) {
	if (!value) {
		return null
	}

	if (typeof value === 'string') {
		return value
	}

	return value.id ?? null
}

function normalizeCount(value: DirectusPartitureUsageAggregateRow['count']) {
	if (typeof value === 'number') {
		return value
	}

	if (typeof value === 'string') {
		const parsed = Number(value)
		return Number.isFinite(parsed) ? parsed : 0
	}

	if (!value || typeof value !== 'object') {
		return 0
	}

	for (const key of ['*', 'all', 'id']) {
		const candidate = value[key]

		if (typeof candidate === 'number') {
			return candidate
		}

		if (typeof candidate === 'string') {
			const parsed = Number(candidate)
			if (Number.isFinite(parsed)) {
				return parsed
			}
		}
	}

	const fallbackValue = Object.values(value)[0]
	if (typeof fallbackValue === 'number') {
		return fallbackValue
	}

	if (typeof fallbackValue === 'string') {
		const parsed = Number(fallbackValue)
		return Number.isFinite(parsed) ? parsed : 0
	}

	return 0
}

const handler = async (event: H3Event): Promise<PartitureListRow[]> => {
	const userId = await getCurrentUserId(event)
	if (!userId) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
	}

	const [partitureResponse, usageResponse] = await Promise.all([
		directusAdminFetch<DirectusListResponse>('/items/partiture', {
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
		}),
		directusAdminFetch<DirectusPartitureUsageAggregateResponse>('/items/page_partiture', {
			query: {
				fields: 'partiture_id',
				aggregate: {
					count: ['*']
				},
				groupBy: ['partiture_id'],
				filter: {
					page_id: {
						user_created: {
							_eq: userId
						}
					}
				},
				limit: 300
			}
		})
	])

	const pageCountByPartitureId = new Map<string, number>()

	for (const aggregateRow of usageResponse.data ?? []) {
		const partitureId = normalizePartitureId(aggregateRow.partiture_id)

		if (!partitureId) {
			continue
		}

		pageCountByPartitureId.set(partitureId, normalizeCount(aggregateRow.count))
	}

	return (partitureResponse.data ?? []).map((item) => ({
		id: item.id,
		name: item.name,
		bpm: item.bpm,
		song: item.song,
		visibility: item.visibility ?? null,
		user_created: item.user_created ?? null,
		date_updated: item.date_updated,
		page_count: pageCountByPartitureId.get(item.id) ?? 0
	}))
}

export default defineEventHandler(handler)
