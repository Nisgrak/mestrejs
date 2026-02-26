import { verifyArgon2Hash } from '../../utils/argon2'
import {
	createPageAccessGrantToken,
	getPageAccessSecret,
	PAGE_ACCESS_COOKIE_NAME,
	PAGE_ACCESS_GRANT_TTL_SECONDS,
	verifyPageAccessGrantToken
} from '../../utils/page-access-grant'

interface PublicPagePartiture {
	id: string
	name: string
	bpm?: number
}

interface PublicPageResult {
	id: string
	name: string
	partitures: PublicPagePartiture[]
}

interface DirectusPageRelation {
	partiture_id?: {
		id?: string
		name?: string
		bpm?: number
	} | null
}

interface DirectusPageItem {
	id?: string
	name?: string
	password?: string | null
	partitures?: DirectusPageRelation[]
}

function toPublicResult(page: DirectusPageItem): PublicPageResult {
	const partitures = (page.partitures ?? [])
		.map((relation) => relation.partiture_id)
		.filter((item): item is NonNullable<DirectusPageRelation['partiture_id']> => Boolean(item?.id && item?.name))
		.map((item) => ({
			id: item.id as string,
			name: item.name as string,
			bpm: item.bpm
		}))

	return {
		id: page.id as string,
		name: page.name as string,
		partitures
	}
}

export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig()
	const pageId = getRouterParam(event, 'id')
	const body = await readBody(event)
	const password = typeof body?.password === 'string' ? body.password : ''

	if (!pageId) {
		throw createError({ statusCode: 400, statusMessage: 'Missing page id' })
	}

	const directusUrl = config.public.directus?.url
	if (!directusUrl) {
		throw createError({ statusCode: 500, statusMessage: 'Directus URL not configured' })
	}

	const adminToken = (config as { directusServerToken?: string }).directusServerToken
	const headers = adminToken ? { Authorization: `Bearer ${adminToken}` } : undefined

	if (!adminToken) {
		throw createError({ statusCode: 500, statusMessage: 'Directus server token not configured' })
	}

	let response: { data?: DirectusPageItem }

	try {
		response = await $fetch<{ data?: DirectusPageItem }>(
			`${directusUrl}/items/page/${pageId}`,
			{
				headers,
				query: {
					fields: 'id,name,password,partitures.partiture_id.id,partitures.partiture_id.name,partitures.partiture_id.bpm'
				}
			}
		)
	} catch (error: any) {
		if (error?.statusCode === 403) {
			throw createError({ statusCode: 403, statusMessage: 'Directus permission denied' })
		}

		throw createError({ statusCode: 404, statusMessage: 'Page not found' })
	}

	const page = response.data
	if (!page?.id || !page?.name) {
		throw createError({ statusCode: 404, statusMessage: 'Page not found' })
	}

	if (page.password) {
		if (!password) {
			throw createError({ statusCode: 401, statusMessage: 'Invalid password' })
		}

		const isValid = await verifyArgon2Hash(page.password, password)
		if (!isValid) {
			throw createError({ statusCode: 401, statusMessage: 'Invalid password' })
		}
	}

	const pageAccessSecret = getPageAccessSecret()
	const existingGrantToken = getCookie(event, PAGE_ACCESS_COOKIE_NAME) ?? ''
	const existingGrant = verifyPageAccessGrantToken(existingGrantToken, pageAccessSecret)
	const grantedPageIds = existingGrant?.pageIds ?? []

	if (!grantedPageIds.includes(pageId)) {
		grantedPageIds.unshift(pageId)
	}

	const grantToken = createPageAccessGrantToken(grantedPageIds, pageAccessSecret)
	setCookie(event, PAGE_ACCESS_COOKIE_NAME, grantToken, {
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		path: '/',
		maxAge: PAGE_ACCESS_GRANT_TTL_SECONDS
	})

	return toPublicResult(page)
})
