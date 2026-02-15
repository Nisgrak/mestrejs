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

export function hasValidCompositionData(sectionLibrary?: Section[], arrangement?: ArrangementItem[]): boolean {
	return Array.isArray(sectionLibrary) && Array.isArray(arrangement)
}
