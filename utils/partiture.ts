import type { ArrangementItem, Section } from '@/stores/songStore'
import { buildCompositionFromLegacySong, buildLegacySongFromComposition, normalizeCompositionData } from './composition'
import { LAST_VERSION, type StateV5 } from './migrateVersions'

export type Partiture = StateV5

// export function savePartiture () {

// }

export async function createPartiture() {
	const songStore = useSongStore()

	const { createItems } = useDirectusItems();
	if (songStore.sectionLibrary.length === 0 && songStore.sections.length > 0) {
		songStore.initializeCompositionFromLegacy()
	}
	songStore.syncLegacySectionsFromComposition()

	const newPartiturePartial: Partial<Partiture> = {
		'song': songStore.sections,
		sectionLibrary: songStore.sectionLibrary,
		arrangement: songStore.arrangement,
		bpm: songStore.bpm,
		name: songStore.name,
		version: LAST_VERSION
	}

	// if (songStore.user === undefined) {
	// 	const fingerprintLibImport = await import('@fingerprintjs/fingerprintjs')
	// 	const fingerprintLib = await fingerprintLibImport.load();
	// 	newPartiturePartial.fingerprint = (await fingerprintLib.get()).visitorId
	// }

	const newPartiture = await createItems<Partiture>({ collection: 'partiture', items: [newPartiturePartial] })

	if (typeof newPartiture[0] === 'string') {

		return newPartiture[0]
	} else {

		return newPartiture[0]?.id
	}

}

export async function updatePartiture(partitureId: string) {
	const songStore = useSongStore()
	const { updateItem } = useDirectusItems();
	if (songStore.sectionLibrary.length === 0 && songStore.sections.length > 0) {
		songStore.initializeCompositionFromLegacy()
	}
	songStore.syncLegacySectionsFromComposition()

	const updatedPartiture: Partial<Partiture> = {
		'song': songStore.sections,
		sectionLibrary: songStore.sectionLibrary,
		arrangement: songStore.arrangement,
		bpm: songStore.bpm,
		name: songStore.name,
		version: LAST_VERSION
	}

	// if (songStore.user === undefined) {
	// 	const fingerprintLibImport = await import('@fingerprintjs/fingerprintjs')
	// 	const fingerprintLib = await fingerprintLibImport.load();
	// 	updatedPartiture.fingerprint = (await fingerprintLib.get()).visitorId
	// }


	await updateItem({ collection: 'partiture', id: partitureId, item: updatedPartiture })
}

export async function loadPartiture(partitureId: string) {
	const songStore = useSongStore()
	const { getItemById } = useDirectusItems();

	const partiture = await getItemById<Partiture>({ collection: 'partiture', id: partitureId });

	const migratedPartiture = migratePartiture(partiture)
	let sectionLibrary: Section[]
	let arrangement: ArrangementItem[]
	const normalizedComposition = normalizeCompositionData(migratedPartiture.sectionLibrary, migratedPartiture.arrangement)

	if (normalizedComposition) {
		sectionLibrary = normalizedComposition.sectionLibrary
		arrangement = normalizedComposition.arrangement
	} else {
		const fallbackComposition = buildCompositionFromLegacySong(migratedPartiture.song)
		sectionLibrary = fallbackComposition.sectionLibrary
		arrangement = fallbackComposition.arrangement
	}

	const legacySong = buildLegacySongFromComposition(sectionLibrary, arrangement)


	songStore.bpm = migratedPartiture.bpm;
	songStore.sectionLibrary = sectionLibrary
	songStore.arrangement = arrangement
	songStore.sections = legacySong;
	songStore.name = migratedPartiture.name


}
