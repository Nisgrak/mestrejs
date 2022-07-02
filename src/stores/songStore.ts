import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Howl } from 'howler';
import { mdiClose, mdiMinus } from '@quasar/extras/mdi-v6'
import { PartialItem, UserItem } from '@directus/sdk';

export const useSongStore = defineStore('song', () => {
	const bpm = ref(90)

	const repeat = ref(true)

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
					howls: new Howl({ src: ['/sounds/alfaia/upperNote.mp3', '/sounds/alfaia/upperNote.wav'], preload: true })
				},
				{
					icon: mdiMinus,
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
					icon: mdiClose,
					howls: new Howl({ src: ['/sounds/caixa/upperNote.mp3', '/sounds/caixa/upperNote.wav'], preload: true })
				},
				{
					icon: mdiMinus,
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
					icon: mdiClose,
					howls: new Howl({ src: ['/sounds/gonge/upperNote.mp3', '/sounds/gonge/upperNote.wav'], preload: true })
				},
				{
					icon: mdiMinus,
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
					icon: mdiClose,
					howls: new Howl({ src: ['/sounds/repique/upperNote.mp3', '/sounds/repique/upperNote.wav'], preload: true })
				},
				{
					icon: mdiMinus,
					howls: new Howl({ src: ['/sounds/repique/lowerNote.mp3', '/sounds/repique/lowerNote.wav'], preload: true })
				},
				{
					icon: 'mdiCircleOutline',
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
					icon: mdiClose,
					howls: new Howl({ src: ['/sounds/surdo/upperNote.mp3', '/sounds/surdo/upperNote.wav'], preload: true })
				},
				{
					icon: 'mdiCheckboxBlankCircle',
					howls: new Howl({ src: ['/sounds/surdo/mediumNote.mp3', '/sounds/surdo/mediumNote.wav'], preload: true })
				},
				{
					icon: mdiMinus,
					howls: new Howl({ src: ['/sounds/surdo/lowerNote.mp3', '/sounds/surdo/lowerNote.wav'], preload: true })
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
					howls: new Howl({ src: ['/sounds/timba/upperNote.mp3', '/sounds/timba/upperNote.wav'], preload: true })
				},
				{
					icon: 'mdiCookie',
					howls: new Howl({ src: ['/sounds/timba/mediumNote.mp3', '/sounds/timba/mediumNote.wav'], preload: true })
				},
				{
					icon: mdiMinus,
					howls: new Howl({ src: ['/sounds/timba/lowerNote.mp3', '/sounds/timba/lowerNote.wav'], preload: true })
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
		user
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


