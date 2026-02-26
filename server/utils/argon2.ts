import { argon2, timingSafeEqual } from 'node:crypto'

type Argon2Algorithm = 'argon2d' | 'argon2i' | 'argon2id'

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

export async function verifyArgon2Hash(storedHash: string, plainPassword: string) {
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
