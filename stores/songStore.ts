import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { Howl } from 'howler';
import { buildArrangementFromLibrary, buildLegacySongFromComposition } from '@/utils/composition'

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
	const sectionLibrary = ref<Section[]>([])
	const arrangement = ref<ArrangementItem[]>([])
	const hasCompositionModel = computed(() => sectionLibrary.value.length > 0 || arrangement.value.length > 0)

	const resolvedSections = computed(() => {
		if (!hasCompositionModel.value) {
			return sections.value
		}

		return buildLegacySongFromComposition(sectionLibrary.value, arrangement.value)
	})

	const user = ref<DirectusUser | undefined>(undefined)

	const instruments = [
		{
			name: 'Alfaia',
			possibleNotes: [
				{
					icon: '',
					printSymbol: '',
					files: []
				},
				{
					icon: 'i-lucide-x',
					printSymbol: 'X',
					howls: new Howl({ src: ['/sounds/alfaia/upperNote.mp3', '/sounds/alfaia/upperNote.wav'], preload: true })
				},
				{
					icon: 'i-lucide-minus',
					printSymbol: '—',
					howls: new Howl({ src: ['/sounds/alfaia/lowerNote.mp3', '/sounds/alfaia/lowerNote.wav'], preload: true })
				}
			]
		},
		{
			name: 'Caixa',
			possibleNotes: [
				{
					icon: '',
					printSymbol: '',
					files: []
				},
				{
					icon: 'i-lucide-x',
					printSymbol: 'X',
					howls: new Howl({ src: ['/sounds/caixa/upperNote.mp3', '/sounds/caixa/upperNote.wav'], preload: true })
				},
				{
					icon: 'i-lucide-minus',
					printSymbol: '—',
					howls: new Howl({ src: ['/sounds/caixa/lowerNote.mp3', '/sounds/caixa/lowerNote.wav'], preload: true })
				}
			]
		},
		{
			name: 'Gonge',
			possibleNotes: [
				{
					icon: '',
					printSymbol: '',
					files: []
				},
				{
					icon: 'i-lucide-x',
					printSymbol: 'X',
					howls: new Howl({ src: ['/sounds/gonge/upperNote.mp3', '/sounds/gonge/upperNote.wav'], preload: true })
				},
				{
					icon: 'i-lucide-minus',
					printSymbol: '—',
					howls: new Howl({ src: ['/sounds/gonge/lowerNote.mp3', '/sounds/gonge/lowerNote.wav'], preload: true })
				}
			]
		},
		{
			name: 'Repique',
			possibleNotes: [
				{
					icon: '',
					printSymbol: '',
					files: []
				},
				{
					icon: 'i-lucide-x',
					printSymbol: 'X',
					howls: new Howl({ src: ['/sounds/repique/repinique.mp3'], preload: true })
				},
				{
					icon: 'i-lucide-minus',
					printSymbol: '—',
					howls: new Howl({ src: ['/sounds/repique/lowerNote.mp3', '/sounds/repique/lowerNote.wav'], preload: true })
				},
				{
					icon: 'i-lucide-circle',
					printSymbol: 'O',
					howls: new Howl({ src: ['/sounds/repique/mediumNote.mp3', '/sounds/repique/mediumNote.wav'], preload: true })
				}
			]
		},
		{
			name: 'Surdo',
			possibleNotes: [
				{
					icon: '',
					printSymbol: '',
					files: []
				},
				{
					icon: 'i-lucide-x',
					printSymbol: 'X',
					howls: new Howl({ src: ['/sounds/surdo/surdo_grave.mp3'], preload: true })
				},
				{
					icon: 'i-lucide-circle',
					printSymbol: 'O',
					howls: new Howl({ src: ['/sounds/surdo/medio.mp3'], preload: true })
				},
				{
					icon: 'i-lucide-minus',
					printSymbol: '—',
					howls: new Howl({ src: ['/sounds/surdo/surdo_agudo.mp3'], preload: true })
				}
			]
		},
		{
			name: 'Timba',
			possibleNotes: [
				{
					icon: '',
					printSymbol: '',
					files: []
				},
				{
					icon: 'i-lucide-x',
					printSymbol: 'B',
					howls: new Howl({ src: ['/sounds/timba/bass.mp3'], preload: true })
				},
				{
					icon: 'i-lucide-cookie',
					printSymbol: 'S',
					howls: new Howl({ src: ['/sounds/timba/slap.mp3'], preload: true })
				},
				{
					icon: 'i-lucide-minus',
					printSymbol: 'O',
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

	function initializeCompositionFromLegacy() {
		if (sections.value.length === 0) {
			sectionLibrary.value = []
			arrangement.value = []
			return
		}

		sectionLibrary.value = JSON.parse(JSON.stringify(sections.value)) as Section[]
		arrangement.value = buildArrangementFromLibrary(sectionLibrary.value)
	}

	function applyComposition(newSectionLibrary: Section[], newArrangement: ArrangementItem[]) {
		sectionLibrary.value = JSON.parse(JSON.stringify(newSectionLibrary)) as Section[]
		arrangement.value = JSON.parse(JSON.stringify(newArrangement)) as ArrangementItem[]
		sections.value = buildLegacySongFromComposition(sectionLibrary.value, arrangement.value)
	}

	function syncLegacySectionsFromComposition() {
		if (!hasCompositionModel.value) {
			return
		}

		sections.value = buildLegacySongFromComposition(sectionLibrary.value, arrangement.value)
	}


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
		beats,
		sectionLibrary,
		arrangement,
		resolvedSections,
		initializeCompositionFromLegacy,
		applyComposition,
		syncLegacySectionsFromComposition
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

export interface ArrangementItem {
	id: string
	sectionId: string
	repeats: number
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
