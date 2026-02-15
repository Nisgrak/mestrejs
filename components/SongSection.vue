<template>
	<div
		v-if="section"
		class="section flex w-full flex-col rounded-lg border-1 p-5"
		:class="horizontalView ? 'md:w-max' : ''"
	>
		<div class="flex flex-wrap">
			<div
				class="mb-5 flex w-full flex-wrap items-center gap-2 md:gap-3"
				:class="{
					'flex-nowrap overflow-hidden bg-white py-2 md:sticky md:left-0 md:z-30 md:w-[600px] md:flex-nowrap md:overflow-x-auto': horizontalView,
					'flex-wrap': !horizontalView
				}"
			>
				<UInput
					class="font-medium"
					:class="horizontalView ? 'min-w-0 flex-1 text-base md:w-44 md:flex-none md:shrink-0' : 'w-full text-xl md:w-72'"
					:model-value="section.name"
					@update:model-value="emit('update:section', Object.assign(section, { name: $event }))"
					aria-label="Nombre de la seccion"
				/>

				<div
					class="flex h-9 items-center gap-0 overflow-hidden rounded-md border border-slate-200 md:shrink-0"
					:class="horizontalView ? 'w-auto shrink-0' : 'w-full md:w-auto'"
				>
					<UTooltip :text="playing ? 'Pausar reproduccion' : 'Reproducir seccion'">
						<UButton
							class="h-full rounded-none rounded-l-md"
							color="primary"
							:disabled="section.instruments.length == 0"
							:icon="playing ? 'i-lucide-square' : 'i-lucide-play'"
							@click="playing ? pause() : play()"
							:aria-label="playing ? 'Pausar reproduccion' : 'Reproducir seccion'"
						/>
					</UTooltip>
					<UTooltip text="Anadir instrumento">
						<UButton
							class="h-9 px-2"
							icon="i-lucide-plus"
							variant="ghost"
							@click="addInstrument"
							aria-label="Anadir instrumento"
						/>
					</UTooltip>
					<UDropdownMenu :items="beatMenuItems">
						<UButton
							class="h-9 px-2"
							variant="ghost"
							:aria-label="`Compas ${section.beat.name}`"
						>
							{{ section.beat.name }}
						</UButton>
					</UDropdownMenu>
					<UTooltip text="Duplicar seccion">
						<UButton
							class="h-9 px-2"
							icon="i-lucide-copy"
							variant="ghost"
							@click="emit('duplicate')"
							aria-label="Duplicar seccion"
						/>
					</UTooltip>
					<UTooltip text="Borrar seccion">
						<UButton
							class="h-9 px-2"
							icon="i-lucide-trash-2"
							variant="ghost"
							color="error"
							@click="askDelete"
							aria-label="Borrar seccion"
						/>
					</UTooltip>
				</div>
			</div>
			<div class="flex-grow" />
		</div>

		<div ref="parentRef">
			<InstrumentRow
				v-for="(instrument, indexInstrument) in section.instruments"
				:ref="instrumentsRefs.set"
				:key="instrument.id"
				:instrument="section.instruments[indexInstrument]"
				:beat="section.beat"
				:horizontal-view="horizontalView"
				:sync-notes-scroll="syncNotesScroll"
				:class="[`beat-${section.beat.name}`, 'mb-2 last:mb-0']"
				@notes-scroll="syncInstrumentNotesScroll(indexInstrument, $event)"
				@update:instrument="emit('update:section', Object.assign(section, { instruments: section.instruments.map((instrument, index) => index === indexInstrument ? $event : instrument) }))"
				@remove="emit('update:section', Object.assign(section, { instruments: section.instruments.filter((_, index) => index !== indexInstrument) }))"
			/>
		</div>

		<UModal
			v-model:open="showConfirmBeatModal"
			title="Cambio de compas"
			description="Cambiar el compas reiniciara las notas de la seccion."
		>
			<template #body>
				<div class="grid gap-3">
					<p>¿Vas a perder todas las notas de esta seccion, estás seguro?</p>
					<div class="flex justify-end gap-2">
						<UButton
							color="neutral"
							variant="ghost"
							@click="cancelBeatChange"
						>Cancelar</UButton>
						<UButton
							color="primary"
							@click="confirmBeatChange"
						>Cambiar</UButton>
					</div>
				</div>
			</template>
		</UModal>

		<UModal
			v-model:open="showDeleteSectionModal"
			title="Borrar seccion"
			description="Esta accion eliminara la seccion completa."
		>
			<template #body>
				<div class="grid gap-3">
					<p>¿Estás seguro que quieres eliminar esta seccion?</p>
					<div class="flex justify-end gap-2">
						<UButton
							color="neutral"
							variant="ghost"
							@click="showDeleteSectionModal = false"
						>Cancelar</UButton>
						<UButton
							color="error"
							@click="confirmDeleteSection"
						>Borrar</UButton>
					</div>
				</div>
			</template>
		</UModal>

		<UModal
			v-model:open="showSelectInstrumentModal"
			title="Selecciona un instrumento"
			description="Elige el instrumento que quieres anadir a la seccion."
		>
			<template #body>
				<div class="grid gap-3">
					<div class="grid grid-cols-2 gap-2 md:grid-cols-3">
						<UButton
							v-for="(instrument, index) in songStore.instruments"
							:key="instrument.name"
							color="neutral"
							variant="outline"
							class="min-h-11 justify-center"
							@click="confirmAddInstrument(index)"
						>
							{{ instrument.name }}
						</UButton>
					</div>
					<div class="flex justify-end gap-2">
						<UButton
							color="neutral"
							variant="ghost"
							@click="showSelectInstrumentModal = false"
						>Cancelar</UButton>
					</div>
				</div>
			</template>
		</UModal>
	</div>
</template>

<script lang="ts" setup>
import { type Beat, type Section } from '../stores/songStore';
import InstrumentRow from './InstrumentRow.vue';
import { type PropType, ref } from 'vue';
import { useTemplateRefsList } from '@vueuse/core'
import NoteBoxVue from './NoteBox.vue';
import { Howl } from 'howler';
import { generateNewLine } from '../utils/lines'
import { dragAndDrop } from '@formkit/drag-and-drop/vue';
import { createId } from '@/utils/id';

let songStore = useSongStore()
let playing = ref(false)
const instrumentsRefs = useTemplateRefsList<InstanceType<typeof InstrumentRow>>()
const toast = useToast()
const showConfirmBeatModal = ref(false)
const showDeleteSectionModal = ref(false)
const showSelectInstrumentModal = ref(false)
const pendingBeat = ref<Beat | null>(null)
const beatMenuItems = computed(() =>
	songStore.beats.map((beat) => ({
		label: beat.name,
		disabled: beat.name === props.section.beat.name,
		onSelect: () => changeBeat(beat)
	}))
)

let getPlayingLength = () => {
	return getTimeOfNote() * getMaxNote();
}
let getTimeOfNote = (groups = props.section.beat.beatsPerBar) => {
	return 60000 / songStore.bpm / groups;
}

let changeBeat = async (newBeat: Beat) => {
	if (newBeat.name === props.section.beat.name) {
		return
	}

	pendingBeat.value = newBeat
	showConfirmBeatModal.value = true
}

let askDelete = () => {
	showDeleteSectionModal.value = true
}

let getMaxNote = () => {
	let maxNote = 0;

	for (let indexInstrument = 0; indexInstrument < props.section.instruments.length; indexInstrument++) {
		let instrument = props.section.instruments[indexInstrument];

		let lineNotes = instrument.noteLines.length * props.section.beat.beatsPerBar * props.section.beat.numOfGroups

		if (lineNotes > maxNote) {
			maxNote = lineNotes;
		}
	}

	return maxNote;
}


let play = (internalPlay = true) => {
	playing.value = true;
	songStore.playing = true;
	// this.$emit("playing");

	for (let indexInstrument = 0; indexInstrument < props.section.instruments.length; indexInstrument++) {
		let instrument = props.section.instruments[indexInstrument];
		const instrumentRow = instrumentsRefs.value[indexInstrument]
		let howls = songStore.getPossibleNotes(instrument.type);
		let accTime = 0
		let noteInInstrument = 0
		const shouldFollowScroll = props.horizontalView && indexInstrument === 0

		if (shouldFollowScroll && instrumentRow && typeof instrumentRow.scrollToNote === 'function') {
			instrumentRow.scrollToNote(0, props.syncNotesScroll, true)
		}

		for (let indexLine = 0; indexLine < instrument.noteLines.length; indexLine++) {
			let noteInLine = 0
			for (let indexGroup = 0; indexGroup < instrument.noteLines[indexLine].length; indexGroup++) {
				let timeOfgroup = getTimeOfNote(instrument.noteLines[indexLine][indexGroup].length)
				for (let indexNote = 0; indexNote < instrument.noteLines[indexLine][indexGroup].length; indexNote++) {
					const note = instrument.noteLines[indexLine][indexGroup][indexNote]

					if (!instrumentRow) {
						continue
					}

					let boxElement = instrumentRow.notesRefs[noteInInstrument];


					// Nota con subidivisiones
					if (Array.isArray(note)) {
						let noteLong = timeOfgroup / note.length

						for (let indexSubNote = 0; indexSubNote < note.length; indexSubNote++) {

							let sound = howls[note[indexSubNote]].howls;

							playNote(accTime, sound, instrument.vol, boxElement, noteLong, indexSubNote, instrumentRow, noteInInstrument, shouldFollowScroll && indexSubNote === 0);
							accTime += noteLong

						}

					} else { // Nota sin subdivision

						let sound = howls[note].howls;

						playNote(accTime, sound, instrument.vol, boxElement, timeOfgroup, undefined, instrumentRow, noteInInstrument, shouldFollowScroll);
						accTime += timeOfgroup
					}

					noteInLine++
					noteInInstrument++
				}

			}


		}
	}
	if (internalPlay && songStore.repeat) {
		instrumentsSoundsList.value.push(
			setTimeout(() => {
				play();
			}, getTimeOfNote() * getMaxNote())
		);
	} else {
		instrumentsSoundsList.value.push(
			setTimeout(() => {
				instrumentsSoundsList.value = [];
				playing.value = false;
				songStore.playing = false;

				// this.$emit('pauseRepeat');

			}, getTimeOfNote() * getMaxNote() - 10)
		);
	}
}

let playNote = (
	time: number,
	sound: Howl | undefined,
	volume: number,
	element: InstanceType<typeof NoteBoxVue>,
	lightTime: number,
	subNote: number | undefined = undefined,
	instrumentRow?: InstanceType<typeof InstrumentRow>,
	noteIndex?: number,
	followScroll = false
) => {
	instrumentsSoundsList.value.push(setTimeout(() => {
		if (sound) {
			sound.volume(volume);
			sound.play();
		}

		element.changeColor(lightTime, subNote);

		if (followScroll && typeof noteIndex === 'number' && instrumentRow && typeof instrumentRow.scrollToNote === 'function') {
			instrumentRow.scrollToNote(noteIndex, props.syncNotesScroll)
		}
	}, time));
}
let pause = () => {
	instrumentsSoundsList.value.forEach(instrument => clearTimeout(instrument));

	instrumentsSoundsList.value = [];
	playing.value = false;
	songStore.playing = false;

	// this.$emit('pause');

}



let instrumentsSoundsList = ref<ReturnType<typeof setTimeout>[]>([])
let addInstrument = () => {
	showSelectInstrumentModal.value = true
}

function confirmAddInstrument(index: number) {
	if (Number.isNaN(index) || index < 0 || index >= songStore.instruments.length) {
		toast.add({ title: 'Instrumento invalido', color: 'warning' })
		return
	}

	createInstrument(index)
	showSelectInstrumentModal.value = false
}

function confirmDeleteSection() {
	showDeleteSectionModal.value = false
	emit('remove')
}

function cancelBeatChange() {
	showConfirmBeatModal.value = false
	pendingBeat.value = null
}

function confirmBeatChange() {
	if (!pendingBeat.value) {
		return
	}

	emit('update:section', Object.assign(props.section, { beat: pendingBeat.value }))

	for (const instrument of props.section.instruments) {
		instrument.noteLines = [generateNewLine(pendingBeat.value.numOfGroups, pendingBeat.value.beatsPerBar)]
	}

	showConfirmBeatModal.value = false
	pendingBeat.value = null
}

function syncInstrumentNotesScroll(sourceIndex: number, scrollLeft: number) {
	if (!props.syncNotesScroll) {
		return
	}

	instrumentsRefs.value.forEach((rowRef, index) => {
		if (index === sourceIndex || !rowRef || typeof rowRef.setNotesScrollLeft !== 'function') {
			return
		}

		rowRef.setNotesScrollLeft(scrollLeft)
	})
}

let createInstrument = (indexInstrument: number) => {

	emit('update:section', Object.assign(props.section, {
		instruments: [
			...props.section.instruments, {
				alias: songStore.instruments[indexInstrument].name,
				id: createId(),
				lines: 1,
				vol: 1,
				type: indexInstrument,
				noteLines: [generateNewLine(props.section.beat.numOfGroups, props.section.beat.beatsPerBar)]

			}
		]
	})
	)
}




let props = defineProps({
	section: {
		type: Object as PropType<Section>,
		required: true,
	},
	horizontalView: {
		type: Boolean,
		required: true,
	},
	syncNotesScroll: {
		type: Boolean,
		required: true,
	}
})

let instruments = computed({
	get: () => props.section.instruments,
	set: (value) => emit('update:section', Object.assign(props.section, { instruments: value }))
})

let emit = defineEmits(['update:section', 'remove', 'duplicate'])

let parentRef = ref<HTMLElement | undefined>(undefined)

// dragAndDrop({
// 	parent: parentRef,
// 	values: instruments,
// 	dragHandle: ".instrument-handle",
// })


defineExpose({
	getPlayingLength,
	play,
	pause,
	idSection: () => props.section.id
})
</script>

<style></style>
