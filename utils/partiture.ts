import type { ArrangementItem, Section } from '@/stores/songStore'
import { buildCompositionFromLegacySong, buildLegacySongFromComposition, normalizeCompositionData } from './composition'
import { LAST_VERSION, type StateV5 } from './migrateVersions'

export type Partiture = StateV5

type Visibility = 'private' | 'public' | 'password' | null

interface PartitureReadResponse extends Partiture {
	visibility?: Visibility
	user_created?: string | null
	can_manage?: boolean
}

export interface LoadedPartitureMeta {
	visibility: Visibility
	userCreated: string | null
	canManage: boolean
}

function getSongToPersist(songStore: ReturnType<typeof useSongStore>): Section[] {
	if (songStore.arrangement.length > 0) {
		return songStore.sections
	}

	return JSON.parse(JSON.stringify(songStore.sectionLibrary)) as Section[]
}

// export function savePartiture () {

// }

export async function createPartiture() {
	const songStore = useSongStore()

	const { createItems } = useDirectusItems();
	if (songStore.sectionLibrary.length === 0 && songStore.sections.length > 0) {
		songStore.initializeCompositionFromLegacy()
	}
	songStore.syncLegacySectionsFromComposition()
	const songToPersist = getSongToPersist(songStore)

	const newPartiturePartial: Partial<Partiture> & { visibility?: 'private' | 'public' } = {
		'song': songToPersist,
		sectionLibrary: songStore.sectionLibrary,
		arrangement: songStore.arrangement,
		bpm: songStore.bpm,
		name: songStore.name,
		visibility: songStore.user ? 'private' : 'public',
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
	const songToPersist = getSongToPersist(songStore)

	const updatedPartiture: Partial<Partiture> = {
		'song': songToPersist,
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

export async function loadPartiture(partitureId: string, password = ''): Promise<LoadedPartitureMeta> {
	const songStore = useSongStore()
	const partiture = await $fetch<PartitureReadResponse>(`/api/partitures/${partitureId}`, {
		method: 'POST',
		body: {
			password
		}
	})

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

	return {
		visibility: partiture.visibility ?? null,
		userCreated: partiture.user_created ?? null,
		canManage: Boolean(partiture.can_manage)
	}
}
