import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { verifyArgon2Hash } from './argon2'

const scrypt = promisify(scryptCallback)

export async function createSharePasswordHash(plainPassword: string) {
	const salt = randomBytes(16).toString('base64url')
	const derived = await scrypt(plainPassword, salt, 64) as Buffer

	return `scrypt$${salt}$${derived.toString('base64url')}`
}

export async function verifySharePassword(storedPassword: string, plainPassword: string) {
	if (storedPassword.startsWith('$argon2')) {
		return await verifyArgon2Hash(storedPassword, plainPassword)
	}

	if (storedPassword.startsWith('scrypt$')) {
		const [prefix, salt, hash] = storedPassword.split('$')

		if (prefix !== 'scrypt' || !salt || !hash) {
			return false
		}

		const stored = Buffer.from(hash, 'base64url')
		const derived = await scrypt(plainPassword, salt, stored.length) as Buffer

		if (derived.length !== stored.length) {
			return false
		}

		return timingSafeEqual(derived, stored)
	}

	return false
}
