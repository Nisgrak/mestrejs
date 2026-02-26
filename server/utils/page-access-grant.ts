import { createHmac, timingSafeEqual } from 'node:crypto'

const GRANT_VERSION = 1

export const PAGE_ACCESS_COOKIE_NAME = 'mestre_page_access_grant'
export const PAGE_ACCESS_GRANT_TTL_SECONDS = 60 * 60 * 8
export const PAGE_ACCESS_GRANT_MAX_PAGE_IDS = 20

interface PageAccessGrantPayload {
	v: number
	p: string[]
	exp: number
}

export interface PageAccessGrant {
	pageIds: string[]
	expiresAt: number
}

function encodeBase64Url(value: string) {
	return Buffer.from(value, 'utf8').toString('base64url')
}

function decodeBase64Url(value: string) {
	return Buffer.from(value, 'base64url').toString('utf8')
}

function signPayload(payloadBase64: string, secret: string) {
	return createHmac('sha256', secret).update(payloadBase64).digest('base64url')
}

function isValidSignature(signature: string, expected: string) {
	const signatureBuffer = Buffer.from(signature)
	const expectedBuffer = Buffer.from(expected)

	if (signatureBuffer.length !== expectedBuffer.length) {
		return false
	}

	return timingSafeEqual(signatureBuffer, expectedBuffer)
}

function normalizePageIds(pageIds: string[]) {
	const deduped = [...new Set(pageIds.filter((id) => typeof id === 'string' && id.length > 0))]
	return deduped.slice(0, PAGE_ACCESS_GRANT_MAX_PAGE_IDS)
}

export function getPageAccessSecret() {
	const config = useRuntimeConfig() as { pageAccessSecret?: string }
	const secret = config.pageAccessSecret?.trim()

	if (!secret) {
		throw createError({ statusCode: 500, statusMessage: 'Page access secret not configured' })
	}

	return secret
}

export function createPageAccessGrantToken(
	pageIds: string[],
	secret: string,
	ttlSeconds = PAGE_ACCESS_GRANT_TTL_SECONDS
) {
	const normalizedPageIds = normalizePageIds(pageIds)
	const now = Math.floor(Date.now() / 1000)
	const payload: PageAccessGrantPayload = {
		v: GRANT_VERSION,
		p: normalizedPageIds,
		exp: now + ttlSeconds
	}

	const payloadBase64 = encodeBase64Url(JSON.stringify(payload))
	const signature = signPayload(payloadBase64, secret)

	return `${payloadBase64}.${signature}`
}

export function verifyPageAccessGrantToken(token: string, secret: string, nowSeconds = Math.floor(Date.now() / 1000)) {
	if (!token || typeof token !== 'string') {
		return null
	}

	const [payloadBase64, signature] = token.split('.')

	if (!payloadBase64 || !signature) {
		return null
	}

	const expected = signPayload(payloadBase64, secret)
	if (!isValidSignature(signature, expected)) {
		return null
	}

	let payload: PageAccessGrantPayload

	try {
		payload = JSON.parse(decodeBase64Url(payloadBase64)) as PageAccessGrantPayload
	} catch {
		return null
	}

	if (payload.v !== GRANT_VERSION || !Array.isArray(payload.p) || typeof payload.exp !== 'number') {
		return null
	}

	if (payload.exp <= nowSeconds) {
		return null
	}

	const normalizedPageIds = normalizePageIds(payload.p)
	if (normalizedPageIds.length === 0) {
		return null
	}

	return {
		pageIds: normalizedPageIds,
		expiresAt: payload.exp
	} satisfies PageAccessGrant
}
