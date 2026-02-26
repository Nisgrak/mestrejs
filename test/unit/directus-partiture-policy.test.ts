import { describe, expect, it } from 'vitest'

const baseUrl = process.env.DIRECTUS_BASE_URL ?? 'https://api.mestrejs.com'
const samplePartitureId = process.env.DIRECTUS_SAMPLE_PARTITURE_ID ?? 'b4db651d-9868-44c1-8fe2-842a80622c37'
const samplePageId = process.env.DIRECTUS_SAMPLE_PAGE_ID ?? '11111111-1111-1111-1111-111111111111'
const samplePagePartitureId = process.env.DIRECTUS_SAMPLE_PAGE_PARTITURE_ID
const userToken = process.env.DIRECTUS_USER_TOKEN
const serverToken = process.env.NUXT_DIRECTUS_SERVER_TOKEN
const expectPublicLockdown = process.env.DIRECTUS_EXPECT_PUBLIC_LOCKDOWN === 'true'

interface DirectusResponse<T = unknown> {
	status: number
	body: T
	raw: string
}

function parseBody(raw: string) {
	if (!raw) {
		return null
	}

	try {
		return JSON.parse(raw)
	} catch {
		return raw
	}
}

async function request<T = unknown>(path: string, token?: string): Promise<DirectusResponse<T>> {
	const headers: Record<string, string> = {}

	if (token) {
		headers.Authorization = `Bearer ${token}`
	}

	const response = await fetch(`${baseUrl}${path}`, { headers })
	const raw = await response.text()

	return {
		status: response.status,
		body: parseBody(raw) as T,
		raw
	}
}

function expectObjectWithFields(value: unknown, fields: string[]) {
	expect(value).toBeTypeOf('object')
	expect(value).not.toBeNull()

	for (const field of fields) {
		expect((value as Record<string, unknown>)[field]).not.toBeUndefined()
	}
}

describe('Directus security policy - public and user token access', () => {
	it('anonymous access to partiture list matches configured rollout stage', async () => {
		const response = await request('/items/partiture?limit=1')

		if (expectPublicLockdown) {
			expect([401, 403]).toContain(response.status)
			return
		}

		expect(response.status).toBe(200)
	})

	it('anonymous access to partiture item matches configured rollout stage', async () => {
		const response = await request(`/items/partiture/${samplePartitureId}`)

		if (expectPublicLockdown) {
			expect([401, 403]).toContain(response.status)
			return
		}

		expect(response.status).toBe(200)
	})

	it('anonymous cannot list page', async () => {
		const response = await request('/items/page?limit=1')

		expect([401, 403]).toContain(response.status)
	})

	it('anonymous cannot read one page by id', async () => {
		const response = await request(`/items/page/${samplePageId}`)

		expect([401, 403]).toContain(response.status)
	})

	it('anonymous cannot list page_partiture junction', async () => {
		const response = await request('/items/page_partiture?limit=1')

		expect([401, 403]).toContain(response.status)
	})

	it('user token cannot read an unrelated partiture by id', async () => {
		expect(userToken, 'DIRECTUS_USER_TOKEN is required').toBeTruthy()

		const response = await request(`/items/partiture/${samplePartitureId}`, userToken)

		expect([401, 403]).toContain(response.status)
	})

	it('user token cannot read an unrelated page by id', async () => {
		expect(userToken, 'DIRECTUS_USER_TOKEN is required').toBeTruthy()

		const response = await request(`/items/page/${samplePageId}`, userToken)

		expect([401, 403]).toContain(response.status)
	})

	it('user token cannot read an unrelated page_partiture row by id', async () => {
		expect(userToken, 'DIRECTUS_USER_TOKEN is required').toBeTruthy()
		expect(samplePagePartitureId, 'DIRECTUS_SAMPLE_PAGE_PARTITURE_ID is required').toBeTruthy()

		const response = await request(`/items/page_partiture/${samplePagePartitureId}`, userToken)

		expect([401, 403]).toContain(response.status)
	})

	it('user token cannot query restricted ownership fields directly', async () => {
		expect(userToken, 'DIRECTUS_USER_TOKEN is required').toBeTruthy()

		const response = await request('/items/partiture?fields=id,user_created&limit=5', userToken)

		expect([401, 403]).toContain(response.status)
	})
})

describe('Directus server token access - required fields for backend routes', () => {
	it('server token can read partiture with fields needed by /api/partitures/:id', async () => {
		expect(serverToken, 'NUXT_DIRECTUS_SERVER_TOKEN is required').toBeTruthy()

		const response = await request<{ data?: unknown }>(
			`/items/partiture/${samplePartitureId}?fields=id,name,bpm,song,sectionLibrary,arrangement,version,user_created,visibility,share_password`,
			serverToken
		)

		expect(response.status).toBe(200)
		expectObjectWithFields(response.body?.data, [
			'id',
			'name',
			'bpm',
			'song',
			'user_created',
			'visibility',
			'share_password'
		])
	})

	it('server token can list page with fields needed by /api/pages', async () => {
		expect(serverToken, 'NUXT_DIRECTUS_SERVER_TOKEN is required').toBeTruthy()

		const response = await request<{ data?: unknown[] }>(
			'/items/page?limit=1&fields=id,name,partitures.partiture_id,user_created,date_updated',
			serverToken
		)

		expect(response.status).toBe(200)
		expect(Array.isArray(response.body?.data)).toBe(true)

		const firstItem = response.body?.data?.[0]
		if (firstItem) {
			expectObjectWithFields(firstItem, ['id', 'name'])
		}
	})

	it('server token can list page_partiture with required relation fields', async () => {
		expect(serverToken, 'NUXT_DIRECTUS_SERVER_TOKEN is required').toBeTruthy()

		const response = await request<{ data?: unknown[] }>(
			'/items/page_partiture?limit=1&fields=id,page_id,partiture_id',
			serverToken
		)

		expect(response.status).toBe(200)
		expect(Array.isArray(response.body?.data)).toBe(true)

		const firstItem = response.body?.data?.[0]
		if (firstItem) {
			expectObjectWithFields(firstItem, ['id', 'page_id', 'partiture_id'])
		}
	})

	it('server token can read a concrete page_partiture row when id is provided', async () => {
		if (!samplePagePartitureId) {
			return
		}

		expect(serverToken, 'NUXT_DIRECTUS_SERVER_TOKEN is required').toBeTruthy()

		const response = await request<{ data?: unknown }>(
			`/items/page_partiture/${samplePagePartitureId}?fields=id,page_id,partiture_id`,
			serverToken
		)

		expect(response.status).toBe(200)
		expectObjectWithFields(response.body?.data, ['id', 'page_id', 'partiture_id'])
	})
})
