import { argon2, timingSafeEqual } from 'node:crypto'

type Argon2Algorithm = 'argon2d' | 'argon2i' | 'argon2id'

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

function parseArgon2Hash(hash: string) {
	const match = hash.match(/^\$(argon2id)\$v=\d+\$m=(\d+),t=(\d+),p=(\d+)\$([^$]+)\$([^$]+)$/)

	if (!match) {
		return null
	}

	const algorithm = match[1]
	const memory = match[2]
	const passes = match[3]
	const parallelism = match[4]
	const salt = match[5]
	const hashedValue = match[6]

	if (!algorithm || !memory || !passes || !parallelism || !salt || !hashedValue) {
		return null
	}

	return {
		algorithm: algorithm as Argon2Algorithm,
		memory: Number(memory),
		passes: Number(passes),
		parallelism: Number(parallelism),
		salt: Buffer.from(salt, 'base64'),
		hash: Buffer.from(hashedValue, 'base64')
	}
}

function deriveArgon2(
	algorithm: Argon2Algorithm,
	password: string,
	salt: Buffer,
	memory: number,
	passes: number,
	parallelism: number,
	tagLength: number
) {
	return new Promise<Buffer>((resolve, reject) => {
		argon2(
			algorithm,
			{
				message: password,
				nonce: salt,
				parallelism,
				tagLength,
				memory,
				passes
			},
			(error, derivedKey) => {
				if (error) {
					reject(error)
					return
				}

				resolve(derivedKey)
			}
		)
	})
}

async function verifyArgon2Hash(storedHash: string, plainPassword: string) {
	const parsed = parseArgon2Hash(storedHash)

	if (!parsed) {
		return false
	}

	const derived = await deriveArgon2(
		parsed.algorithm,
		plainPassword,
		parsed.salt,
		parsed.memory,
		parsed.passes,
		parsed.parallelism,
		parsed.hash.length
	)

	if (derived.length !== parsed.hash.length) {
		return false
	}

	return timingSafeEqual(derived, parsed.hash)
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

	return toPublicResult(page)
})
