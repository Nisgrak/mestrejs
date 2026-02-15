import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Howl } from 'howler';

type DirectusUser = Record<string, any>

export const useSongStore = defineStore('song', () => {
	const bpm = ref(90)
	const name = ref('Partitura sin nombre')

	const beats: readonly Beat[] = [
		{
			name: '4/4',
			beatsPerBar: 4,
			numOfGroups: 4
		},
		{
			name: '6/8',
			beatsPerBar: 6,
			numOfGroups: 2
		},

	] as const

	const repeat = ref(true)
	const showNote = ref(false)
	const horizontalView = ref(false)

	const sections = ref<Section[]>([])

	const user = ref<DirectusUser | undefined>(undefined)

	const instruments = [
		{
			name: 'Alfaia',
			possibleNotes: [
				{
					icon: '',
					files: []
				},
				{
					icon: 'x',
					howls: new Howl({ src: ['/sounds/alfaia/upperNote.mp3', '/sounds/alfaia/upperNote.wav'], preload: true })
				},
				{
					icon: '-',
					howls: new Howl({ src: ['/sounds/alfaia/lowerNote.mp3', '/sounds/alfaia/lowerNote.wav'], preload: true })
				}
			]
		},
		{
			name: 'Caixa',
			possibleNotes: [
				{
					icon: '',
					files: []
				},
				{
					icon: 'x',
					howls: new Howl({ src: ['/sounds/caixa/upperNote.mp3', '/sounds/caixa/upperNote.wav'], preload: true })
				},
				{
					icon: '-',
					howls: new Howl({ src: ['/sounds/caixa/lowerNote.mp3', '/sounds/caixa/lowerNote.wav'], preload: true })
				}
			]
		},
		{
			name: 'Gonge',
			possibleNotes: [
				{
					icon: '',
					files: []
				},
				{
					icon: 'x',
					howls: new Howl({ src: ['/sounds/gonge/upperNote.mp3', '/sounds/gonge/upperNote.wav'], preload: true })
				},
				{
					icon: '-',
					howls: new Howl({ src: ['/sounds/gonge/lowerNote.mp3', '/sounds/gonge/lowerNote.wav'], preload: true })
				}
			]
		},
		{
			name: 'Repique',
			possibleNotes: [
				{
					icon: '',
					files: []
				},
				{
					icon: 'x',
					howls: new Howl({ src: ['/sounds/repique/repinique.mp3'], preload: true })
				},
				{
					icon: '-',
					howls: new Howl({ src: ['/sounds/repique/lowerNote.mp3', '/sounds/repique/lowerNote.wav'], preload: true })
				},
				{
					icon: 'o',
					howls: new Howl({ src: ['/sounds/repique/mediumNote.mp3', '/sounds/repique/mediumNote.wav'], preload: true })
				}
			]
		},
		{
			name: 'Surdo',
			possibleNotes: [
				{
					icon: '',
					files: []
				},
				{
					icon: 'x',
					howls: new Howl({ src: ['/sounds/surdo/surdo_grave.mp3'], preload: true })
				},
				{
					icon: 'O',
					howls: new Howl({ src: ['/sounds/surdo/medio.mp3'], preload: true })
				},
				{
					icon: '-',
					howls: new Howl({ src: ['/sounds/surdo/surdo_agudo.mp3'], preload: true })
				}
			]
		},
		{
			name: 'Timba',
			possibleNotes: [
				{
					icon: '',
					files: []
				},
				{
					icon: 'x',
					howls: new Howl({ src: ['/sounds/timba/bass.mp3'], preload: true })
				},
				{
					icon: '*',
					howls: new Howl({ src: ['/sounds/timba/slap.mp3'], preload: true })
				},
				{
					icon: '-',
					howls: new Howl({ src: ['/sounds/timba/open.mp3'], preload: true })
				}
			]
		}
	]

	function getPossibleNotes(index: number) {

		return instruments[index].possibleNotes;

	}


	function getNameIntrument(index: number) {

		return instruments[index].name;

	}


	function getIconNoteInstrument(index: number, indexNote: number) {

		return instruments[index].possibleNotes[indexNote].icon;

	}


	const playing = ref(false)


	return {
		bpm, sections, instruments, getPossibleNotes,
		getNameIntrument,
		getIconNoteInstrument,
		repeat,
		playing,
		user,
		name,
		showNote,
		horizontalView,
		beats
	}
})

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useSongStore, import.meta.hot))
}

export interface Section {
	id: string;
	name: string;
	instruments: Instrument[];
	beat: Beat;
}

export interface Beat {
	name: string;
	beatsPerBar: number;
	numOfGroups: number;
}

export interface Page {
	id: string
	name: string
	password: string
	partitures: Partiture[]
}

export interface Instrument {
	id: string
	type: number;
	alias: string;
	lines: number;
	vol: number;
	noteLines: Note[][][]
}

export type Note = number[] | number;
