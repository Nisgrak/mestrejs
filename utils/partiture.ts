import { DirectusUser } from "nuxt-directus/dist/runtime/types";
import { LAST_VERSION, StateV4 } from "./migrateVersions";

export type Partiture = StateV4

// export function savePartiture () {

// }

export async function createPartiture() {
	const songStore = useSongStore()

	const { createItems } = useDirectusItems();

	const newPartiturePartial: Partial<Partiture> = {
		'song': songStore.sections,
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

	const updatedPartiture: Partial<Partiture> = {
		'song': songStore.sections,
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


	songStore.bpm = migratedPartiture.bpm;
	songStore.sections = migratedPartiture.song;
	songStore.name = migratedPartiture.name


}
