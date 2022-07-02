import { useSongStore } from 'src/stores/songStore'
import directus from './directus'


// export function savePartiture () {

// }

export async function createPartiture () {
	const songStore = useSongStore()

	const newPartiture = await directus.items('partiture').createOne({
		'song': songStore.sections,
		bpm: songStore.bpm,
	})

	if (typeof newPartiture === 'string') {

		return newPartiture
	} else {

		return newPartiture?.id
	}

}

export async function updatePartiture (partitureId: string) {
	const songStore = useSongStore()


	await directus.items('partiture').updateOne(partitureId, {
		'song': songStore.sections,
		bpm: songStore.bpm,
	})
}

export async function loadPartiture (partitureId: string) {
	const songStore = useSongStore()


	const partiture = await directus.items('partiture').readOne(partitureId);

	if (partiture?.bpm) {

		songStore.bpm = partiture?.bpm;
	}

	if (partiture?.song) {

		// @ts-expect-error So boring Directus types...
		songStore.sections = partiture?.song;
	}

}
