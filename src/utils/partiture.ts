import { useSongStore } from 'src/stores/songStore'
import directus, { Partiture } from './directus'


// export function savePartiture () {

// }

export async function createPartiture () {
	const songStore = useSongStore()

	const newPartiturePartial: Partial<Partiture> = {
		'song': songStore.sections,
		bpm: songStore.bpm,
		name: songStore.name,
	}

	// if (songStore.user === undefined) {
	// 	const fingerprintLibImport = await import('@fingerprintjs/fingerprintjs')
	// 	const fingerprintLib = await fingerprintLibImport.load();
	// 	newPartiturePartial.fingerprint = (await fingerprintLib.get()).visitorId
	// }

	const newPartiture = await directus.items('partiture').createOne(newPartiturePartial)

	if (typeof newPartiture === 'string') {

		return newPartiture
	} else {

		return newPartiture?.id
	}

}

export async function updatePartiture (partitureId: string) {
	const songStore = useSongStore()

	const updatedPartiture: Partial<Partiture> = {
		'song': songStore.sections,
		bpm: songStore.bpm,
		name: songStore.name,
	}

	// if (songStore.user === undefined) {
	// 	const fingerprintLibImport = await import('@fingerprintjs/fingerprintjs')
	// 	const fingerprintLib = await fingerprintLibImport.load();
	// 	updatedPartiture.fingerprint = (await fingerprintLib.get()).visitorId
	// }


	await directus.items('partiture').updateOne(partitureId, updatedPartiture)
}

export async function loadPartiture (partitureId: string) {
	const songStore = useSongStore()


	const partiture = await directus.items('partiture').readOne(partitureId);

	if (partiture?.bpm) {

		songStore.bpm = partiture.bpm;
	}

	if (partiture?.song) {

		// @ts-expect-error So boring Directus types...
		songStore.sections = partiture.song;
	}
	if (partiture?.name) {

		songStore.name = partiture.name
	}

}
