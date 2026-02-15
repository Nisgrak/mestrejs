import type { ArrangementItem, Section } from '@/stores/songStore'

function cloneSection(section: Section): Section {
	return JSON.parse(JSON.stringify(section)) as Section
}

function normalizeRepeats(repeats: number | undefined): number {
	if (!Number.isFinite(repeats)) {
		return 1
	}

	return Math.max(1, Math.floor(repeats as number))
}

function tryParseArray<T>(value: unknown): T[] | undefined {
	if (Array.isArray(value)) {
		return value as T[]
	}

	if (typeof value !== 'string') {
		return undefined
	}

	try {
		const parsed = JSON.parse(value)
		if (Array.isArray(parsed)) {
			return parsed as T[]
		}
	} catch {
	}

	return undefined
}

function sanitizeSectionLibrary(sectionLibrary: Section[]): Section[] {
	return sectionLibrary
		.filter((section) => section && typeof section === 'object')
		.map((section, index) => ({
			...cloneSection(section),
			id: String(section.id || `section-${index}`)
		}))
}

function sanitizeArrangement(arrangement: ArrangementItem[], sectionIds: Set<string>): ArrangementItem[] {
	return arrangement
		.filter((item) => item && typeof item === 'object')
		.map((item, index) => ({
			id: String(item.id || `arr-${index}`),
			sectionId: String(item.sectionId || ''),
			repeats: normalizeRepeats(Number(item.repeats))
		}))
		.filter((item) => item.sectionId.length > 0 && sectionIds.has(item.sectionId))
}

export function buildArrangementFromLibrary(sectionLibrary: Section[]): ArrangementItem[] {
	return sectionLibrary.map((section, index) => ({
		id: `arr-${index}-${section.id}`,
		sectionId: section.id,
		repeats: 1
	}))
}

export function buildLegacySongFromComposition(sectionLibrary: Section[], arrangement: ArrangementItem[]): Section[] {
	const byId = new Map(sectionLibrary.map((section) => [section.id, section]))
	const expanded: Section[] = []

	for (const item of arrangement) {
		const section = byId.get(item.sectionId)
		if (!section) {
			continue
		}

		const repeats = normalizeRepeats(item.repeats)
		for (let repeatIndex = 0; repeatIndex < repeats; repeatIndex++) {
			const instance = cloneSection(section)
			instance.id = `${item.id}:${repeatIndex}`
			expanded.push(instance)
		}
	}

	return expanded
}

export function normalizeCompositionData(sectionLibraryValue: unknown, arrangementValue: unknown): {
	sectionLibrary: Section[]
	arrangement: ArrangementItem[]
} | null {
	const parsedSectionLibrary = tryParseArray<Section>(sectionLibraryValue)
	const parsedArrangement = tryParseArray<ArrangementItem>(arrangementValue)

	if (!parsedSectionLibrary || !parsedArrangement) {
		return null
	}

	const sectionLibrary = sanitizeSectionLibrary(parsedSectionLibrary)
	const sectionIds = new Set(sectionLibrary.map((section) => section.id))
	const arrangement = sanitizeArrangement(parsedArrangement, sectionIds)

	return {
		sectionLibrary,
		arrangement
	}
}

export function buildCompositionFromLegacySong(songValue: unknown): {
	sectionLibrary: Section[]
	arrangement: ArrangementItem[]
} {
	const parsedSong = tryParseArray<Section>(songValue) || []
	const sectionLibrary: Section[] = []
	const arrangement: ArrangementItem[] = []
	const arrangementCounter = new Map<string, number>()

	for (let index = 0; index < parsedSong.length; index++) {
		const rawSection = parsedSong[index]
		if (!rawSection || typeof rawSection !== 'object') {
			continue
		}

		const section = cloneSection(rawSection)
		const rawId = String(section.id || `legacy-${index}`)
		const repeatMatch = rawId.match(/^(.+):(\d+)$/)

		if (repeatMatch) {
			const baseArrangementId = repeatMatch[1]
			let repeats = 1
			while (index + repeats < parsedSong.length) {
				const probeId = String(parsedSong[index + repeats]?.id || '')
				if (!probeId.startsWith(`${baseArrangementId}:`)) {
					break
				}
				repeats += 1
			}

			const seen = (arrangementCounter.get(baseArrangementId) || 0) + 1
			arrangementCounter.set(baseArrangementId, seen)
			const arrangementId = seen === 1 ? baseArrangementId : `${baseArrangementId}-${seen}`
			const sectionId = `section-${arrangementId}`

			section.id = sectionId
			sectionLibrary.push(section)
			arrangement.push({
				id: arrangementId,
				sectionId,
				repeats
			})
			index += repeats - 1

			continue
		}

		const sectionId = rawId
		section.id = sectionId
		sectionLibrary.push(section)
		arrangement.push({
			id: `arr-${index}-${sectionId}`,
			sectionId,
			repeats: 1
		})
	}

	return {
		sectionLibrary,
		arrangement
	}
}

export function hasValidCompositionData(sectionLibrary?: Section[], arrangement?: ArrangementItem[]): boolean {
	return Array.isArray(sectionLibrary) && Array.isArray(arrangement)
}
