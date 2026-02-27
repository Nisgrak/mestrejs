<template>
	<div
		v-if="section"
		class="section flex w-full flex-col rounded-lg border-1 p-5"
		:class="horizontalView ? 'md:w-max' : ''"
	>
		<div class="flex flex-wrap">
			<div
				ref="sectionControlsRef"
				class="mb-5 flex flex-wrap items-center gap-2 md:gap-3"
				:style="sectionControlsStyle"
				:class="{
					'w-[320px] flex-nowrap overflow-x-auto bg-white py-2 lg:w-[600px]': horizontalView,
					'w-full flex-wrap': !horizontalView
				}"
			>
				<UInput
					class="font-medium"
					:class="horizontalView ? 'min-w-0 flex-1 text-base md:w-44 md:flex-none md:shrink-0' : 'w-full text-xl md:w-72'"
					:model-value="section.name"
					@update:model-value="emit('update:section', Object.assign(section, { name: $event }))"
					aria-label="Nombre de la sección"
				/>

				<div
					class="flex h-9 items-center gap-0 overflow-hidden rounded-md border border-slate-200 md:shrink-0"
					:class="horizontalView ? 'w-auto shrink-0' : 'w-full md:w-auto'"
				>
					<UTooltip :text="playing ? 'Pausar reproducción' : 'Reproducir sección'">
						<UButton
							class="h-full rounded-none rounded-l-md"
							color="primary"
							:disabled="section.instruments.length == 0"
							:icon="playing ? 'i-lucide-square' : 'i-lucide-play'"
							@click="playing ? pause() : play()"
							:aria-label="playing ? 'Pausar reproducción' : 'Reproducir sección'"
						/>
					</UTooltip>
					<UTooltip text="Añadir instrumento">
						<UButton
							class="h-9 px-2"
							icon="i-lucide-plus"
							variant="ghost"
							@click="addInstrument"
							aria-label="Añadir instrumento"
						/>
					</UTooltip>
					<UDropdownMenu :items="beatMenuItems">
						<UButton
							class="h-9 px-2"
							variant="ghost"
							:aria-label="`Compás ${section.beat.name}`"
						>
							{{ section.beat.name }}
						</UButton>
					</UDropdownMenu>
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
			title="Cambio de compás"
			description="Cambiar el compás reiniciará las notas de la sección."
		>
			<template #body>
				<div class="grid gap-3">
					<p>¿Vas a perder todas las notas de esta sección, estás seguro?</p>
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
			v-model:open="showSelectInstrumentModal"
			title="Selecciona un instrumento"
			description="Elige el instrumento que quieres añadir a la sección."
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
import { computed, nextTick, onBeforeUnmount, onMounted, type PropType, ref, watch } from 'vue';
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
const showSelectInstrumentModal = ref(false)
const pendingBeat = ref<Beat | null>(null)
const sectionControlsOffset = ref(0)
const SECTION_LEFT_BLEED_PX = 12
const sectionControlsBaseScrollLeft = ref(0)
const sectionControlsPinThreshold = ref(0)
const sectionControlsStyle = computed(() => {
	if (!props.horizontalView) {
		return undefined
	}

	return {
		transform: `translateX(${sectionControlsOffset.value}px)`,
		willChange: 'transform'
	}
})
let sectionControlsScrollTarget: HTMLElement | null = null
let sectionControlsRafId = 0
const sectionControlsRef = ref<HTMLElement | null>(null)
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
	if (props.syncNotesScroll) {
		sectionControlsOffset.value = Math.max(0, scrollLeft)
	}

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

function handleSectionControlsScroll() {
	if (!sectionControlsScrollTarget) {
		return
	}

	if (!sectionControlsScrollTarget.isConnected) {
		bindSectionControlsScroll()
		return
	}

	if (sectionControlsRafId) {
		return
	}

	sectionControlsRafId = requestAnimationFrame(() => {
		updateSectionControlsOffset()
		sectionControlsRafId = 0
	})
}

function updateSectionControlsOffset() {
	if (!props.horizontalView || !sectionControlsRef.value) {
		sectionControlsOffset.value = 0
		return
	}

	if (props.syncNotesScroll) {
		if (sectionControlsScrollTarget) {
			sectionControlsOffset.value = Math.max(0, sectionControlsScrollTarget.scrollLeft)
		}
		return
	}
	if (!sectionControlsScrollTarget) {
		sectionControlsOffset.value = 0
		return
	}

	const deltaScroll = sectionControlsScrollTarget.scrollLeft - sectionControlsBaseScrollLeft.value
	sectionControlsOffset.value = Math.max(0, deltaScroll - sectionControlsPinThreshold.value)
}

function unbindSectionControlsScroll() {
	if (!sectionControlsScrollTarget) {
		return
	}

	sectionControlsScrollTarget.removeEventListener('scroll', handleSectionControlsScroll)
	sectionControlsScrollTarget = null
}

function bindSectionControlsScroll() {
	unbindSectionControlsScroll()
	sectionControlsOffset.value = 0

	if (!props.horizontalView) {
		return
	}

	nextTick(() => {
		const target = parentRef.value?.closest('[data-notes-scroll-root]') as HTMLElement | null
		if (!target) {
			return
		}

		sectionControlsScrollTarget = target
		sectionControlsBaseScrollLeft.value = target.scrollLeft
		sectionControlsPinThreshold.value = Math.max(0, sectionControlsRef.value?.getBoundingClientRect().left ?? 0) - SECTION_LEFT_BLEED_PX
		updateSectionControlsOffset()
		target.addEventListener('scroll', handleSectionControlsScroll, { passive: true })
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

let emit = defineEmits(['update:section'])

let parentRef = ref<HTMLElement | undefined>(undefined)

watch(() => [props.horizontalView, props.syncNotesScroll], bindSectionControlsScroll, { immediate: true })

onBeforeUnmount(() => {
	unbindSectionControlsScroll()
	if (sectionControlsRafId) {
		cancelAnimationFrame(sectionControlsRafId)
		sectionControlsRafId = 0
	}
	if (typeof window !== 'undefined') {
		window.removeEventListener('resize', bindSectionControlsScroll)
		window.removeEventListener('orientationchange', bindSectionControlsScroll)
	}
})

onMounted(() => {
	if (typeof window === 'undefined') {
		return
	}

	window.addEventListener('resize', bindSectionControlsScroll)
	window.addEventListener('orientationchange', bindSectionControlsScroll)
	nextTick(() => {
		bindSectionControlsScroll()
	})
})

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
