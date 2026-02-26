import { directusAdminFetch, getCurrentUserId } from '../../utils/directus'
import { getPageAccessSecret, PAGE_ACCESS_COOKIE_NAME, verifyPageAccessGrantToken } from '../../utils/page-access-grant'
import { verifySharePassword } from '../../utils/share-password'
import type { H3Event } from 'h3'

type Visibility = 'private' | 'public' | 'password' | null

interface PartitureReadBody {
	password?: string
}

interface DirectusPartiture {
	id: string
	name: string
	bpm: number
	song: unknown
	sectionLibrary?: unknown
	arrangement?: unknown
	version?: number
	user_created?: string | null
	visibility?: Visibility
	share_password?: string | null
}

interface DirectusPartitureResponse {
	data?: DirectusPartiture
}

interface DirectusPagePartitureLookupResponse {
	data?: Array<{
		id?: number | string
	}>
}

function canRead(item: DirectusPartiture, userId: string | null) {
	if (!item.user_created) {
		return true
	}

	if (userId && item.user_created === userId) {
		return true
	}

	if (!item.visibility || item.visibility === 'public') {
		return true
	}

	return false
}

async function hasPageGrantAccess(event: H3Event, partitureId: string) {
	const grantToken = getCookie(event, PAGE_ACCESS_COOKIE_NAME) ?? ''
	if (!grantToken) {
		return false
	}

	let secret = ''

	try {
		secret = getPageAccessSecret()
	} catch {
		return false
	}

	const grant = verifyPageAccessGrantToken(grantToken, secret)
	if (!grant || grant.pageIds.length === 0) {
		return false
	}

	try {
		const response = await directusAdminFetch<DirectusPagePartitureLookupResponse>('/items/page_partiture', {
			query: {
				fields: 'id',
				filter: {
					_and: [
						{
							page_id: {
								_in: grant.pageIds
							}
						},
						{
							partiture_id: {
								_eq: partitureId
							}
						}
					]
				},
				limit: 1
			}
		})

		return Boolean(response.data?.[0]?.id)
	} catch {
		return false
	}
}

export default defineEventHandler(async (event) => {
	const partitureId = getRouterParam(event, 'id')
	const body = await readBody<PartitureReadBody>(event)
	const userId = await getCurrentUserId(event)

	if (!partitureId) {
		throw createError({ statusCode: 400, statusMessage: 'Missing partiture id' })
	}

	let response: DirectusPartitureResponse

	try {
		response = await directusAdminFetch<DirectusPartitureResponse>(`/items/partiture/${partitureId}`, {
			query: {
				fields: 'id,name,bpm,song,sectionLibrary,arrangement,version,user_created,visibility,share_password'
			}
		})
	} catch {
		throw createError({ statusCode: 404, statusMessage: 'Partiture not found' })
	}

	const item = response.data
	if (!item) {
		throw createError({ statusCode: 404, statusMessage: 'Partiture not found' })
	}

	if (canRead(item, userId)) {
		const canManage = Boolean(userId && item.user_created && userId === item.user_created)
		return {
			id: item.id,
			name: item.name,
			bpm: item.bpm,
			song: item.song,
			sectionLibrary: item.sectionLibrary,
			arrangement: item.arrangement,
			version: item.version,
			visibility: item.visibility ?? null,
			user_created: item.user_created ?? null,
			can_manage: canManage
		}
	}

	if (await hasPageGrantAccess(event, partitureId)) {
		return {
			id: item.id,
			name: item.name,
			bpm: item.bpm,
			song: item.song,
			sectionLibrary: item.sectionLibrary,
			arrangement: item.arrangement,
			version: item.version,
			visibility: item.visibility ?? null,
			user_created: item.user_created ?? null,
			can_manage: false
		}
	}

	if (item.visibility === 'password') {
		const password = typeof body?.password === 'string' ? body.password : ''

		if (!password || !item.share_password) {
			throw createError({ statusCode: 401, statusMessage: 'Password required' })
		}

		const isValid = await verifySharePassword(item.share_password, password)
		if (!isValid) {
			throw createError({ statusCode: 401, statusMessage: 'Invalid password' })
		}

		return {
			id: item.id,
			name: item.name,
			bpm: item.bpm,
			song: item.song,
			sectionLibrary: item.sectionLibrary,
			arrangement: item.arrangement,
			version: item.version,
			visibility: item.visibility ?? null,
			user_created: item.user_created ?? null,
			can_manage: false
		}
	}

	throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
})
