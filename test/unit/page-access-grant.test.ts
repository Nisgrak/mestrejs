import { describe, expect, it } from 'vitest'
import {
	createPageAccessGrantToken,
	PAGE_ACCESS_GRANT_MAX_PAGE_IDS,
	verifyPageAccessGrantToken
} from '../../server/utils/page-access-grant'

describe('page access grant token', () => {
	it('creates and verifies a valid grant token', () => {
		const secret = 'test-secret'
		const token = createPageAccessGrantToken(['page-1'], secret, 120)
		const verified = verifyPageAccessGrantToken(token, secret)

		expect(verified).not.toBeNull()
		expect(verified?.pageIds).toEqual(['page-1'])
		expect(typeof verified?.expiresAt).toBe('number')
	})

	it('rejects token with invalid signature', () => {
		const secret = 'test-secret'
		const token = createPageAccessGrantToken(['page-1'], secret, 120)
		const tampered = `${token}x`

		expect(verifyPageAccessGrantToken(tampered, secret)).toBeNull()
	})

	it('rejects expired token', () => {
		const secret = 'test-secret'
		const token = createPageAccessGrantToken(['page-1'], secret, 1)
		const verified = verifyPageAccessGrantToken(token, secret, Math.floor(Date.now() / 1000) + 2)

		expect(verified).toBeNull()
	})

	it('deduplicates page ids and enforces max size', () => {
		const secret = 'test-secret'
		const pageIds = ['page-1', 'page-1', ...Array.from({ length: PAGE_ACCESS_GRANT_MAX_PAGE_IDS + 5 }, (_, i) => `p-${i}`)]
		const token = createPageAccessGrantToken(pageIds, secret, 120)
		const verified = verifyPageAccessGrantToken(token, secret)

		expect(verified).not.toBeNull()
		expect(verified?.pageIds.length).toBe(PAGE_ACCESS_GRANT_MAX_PAGE_IDS)
		expect(new Set(verified?.pageIds).size).toBe(verified?.pageIds.length)
	})
})
