import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Howl } from 'howler';
import { mdiClose, mdiMinus } from '@quasar/extras/mdi-v6'
import { PartialItem, UserItem } from '@directus/sdk';

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

	const user = ref<PartialItem<UserItem> | undefined>(undefined)

	const instruments =  [
		{
			name: 'Alfaia',
			possibleNotes: [
				{
					icon: '',
					files: []
				},
				{
					icon: mdiClose,
					howls: new Howl({ src: [new URL('/sounds/alfaia/upperNote.mp3', import.meta.url).href, new URL('/sounds/alfaia/upperNote.wav', import.meta.url).href], preload: true })
				},
				{
					icon: mdiMinus,
					howls: new Howl({ src: [new URL('/sounds/alfaia/lowerNote.mp3', import.meta.url).href, new URL('/sounds/alfaia/lowerNote.wav', import.meta.url).href], preload: true })
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
					icon: mdiClose,
					howls: new Howl({ src: [new URL('/sounds/caixa/upperNote.mp3', import.meta.url).href, new URL('/sounds/caixa/upperNote.wav', import.meta.url).href], preload: true })
				},
				{
					icon: mdiMinus,
					howls: new Howl({ src: [new URL('/sounds/caixa/lowerNote.mp3', import.meta.url).href, new URL('/sounds/caixa/lowerNote.wav', import.meta.url).href], preload: true })
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
					icon: mdiClose,
					howls: new Howl({ src: [new URL('/sounds/gonge/upperNote.mp3', import.meta.url).href, new URL('/sounds/gonge/upperNote.wav', import.meta.url).href], preload: true })
				},
				{
					icon: mdiMinus,
					howls: new Howl({ src: [new URL('/sounds/gonge/lowerNote.mp3', import.meta.url).href, new URL('/sounds/gonge/lowerNote.wav', import.meta.url).href], preload: true })
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
					icon: mdiClose,
					howls: new Howl({ src: [new URL('/sounds/repique/upperNote.mp3', import.meta.url).href, new URL('/sounds/repique/upperNote.wav', import.meta.url).href], preload: true })
				},
				{
					icon: mdiMinus,
					howls: new Howl({ src: [new URL('/sounds/repique/lowerNote.mp3', import.meta.url).href, new URL('/sounds/repique/lowerNote.wav', import.meta.url).href], preload: true })
				},
				{
					icon: 'mdiCircleOutline',
					howls: new Howl({ src: [new URL('/sounds/repique/mediumNote.mp3', import.meta.url).href, new URL('/sounds/repique/mediumNote.wav', import.meta.url).href], preload: true })
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
					icon: mdiClose,
					howls: new Howl({ src: [new URL('/sounds/surdo/upperNote.mp3', import.meta.url).href, new URL('/sounds/surdo/upperNote.wav', import.meta.url).href], preload: true })
				},
				{
					icon: 'mdiCheckboxBlankCircle',
					howls: new Howl({ src: [new URL('/sounds/surdo/mediumNote.mp3', import.meta.url).href, new URL('/sounds/surdo/mediumNote.wav', import.meta.url).href], preload: true })
				},
				{
					icon: mdiMinus,
					howls: new Howl({ src: [new URL('/sounds/surdo/lowerNote.mp3', import.meta.url).href, new URL('/sounds/surdo/lowerNote.wav', import.meta.url).href], preload: true })
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
					icon: mdiClose,
					howls: new Howl({ src: [new URL('/sounds/timba/upperNote.mp3', import.meta.url).href, new URL('/sounds/timba/upperNote.wav', import.meta.url).href], preload: true })
				},
				{
					icon: 'mdiCookie',
					howls: new Howl({ src: [new URL('/sounds/timba/mediumNote.mp3', import.meta.url).href, new URL('/sounds/timba/mediumNote.wav', import.meta.url).href], preload: true })
				},
				{
					icon: mdiMinus,
					howls: new Howl({ src: [new URL('/sounds/timba/lowerNote.mp3', import.meta.url).href, new URL('/sounds/timba/lowerNote.wav', import.meta.url).href], preload: true })
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


	return { bpm, sections, instruments, getPossibleNotes,
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

export interface Instrument {
  id: string
  type: number;
  alias: string;
  lines: number;
  vol: number;
  notes: Note[];
}

export type Note = number[] | number;


