<template>
	<div
		class="note relative grid h-50px w-50px border-1 border-slate-500"
		:class="{
			'!border-red-600 z-2': actualNotePlaying === true,
			[`defaultSubnotes-${Array.isArray(note) && note.length}`]: Array.isArray(note),
			'unique-note': !Array.isArray(note),
			'multi-note': Array.isArray(note),
			'show-note': songStore.showNote
		}"
		@contextmenu="changeNoteType"
		@touchstart="handleTouchStart"
		@touchend="handleTouchEnd"
		@touchcancel="handleTouchEnd"
		@touchmove="handleTouchMove"
	>
		<div
			v-if="!Array.isArray(note)"
			class="w-full h-full"
			@click="handleMainNoteClick"
		>
			<div class="grid h-full w-full place-items-center">
				<UIcon
					v-if="getIconName(instrumentIndex, note)"
					:name="getIconName(instrumentIndex, note)!"
					class="h-8 w-8"
				/>
			</div>
		</div>
		<template v-else>
			<div
				v-for="(subNote, index) in note"
				:key="index"
				:class="[`note${index}`, typeof actualNotePlaying === 'number' && index === actualNotePlaying ? '!border-red-600' : '']"
				class="flex h-full w-full items-center justify-center"
				@click="handleSubNoteClick(index)"
			>
				<UIcon
					v-if="getIconName(instrumentIndex, subNote)"
					:name="getIconName(instrumentIndex, subNote)!"
					class="h-4 w-4"
				/>
			</div>
		</template>
	</div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, type PropType, ref } from 'vue';


const props = defineProps({
	note: {
		type: [Number, Array] as PropType<number | number[]>,
		required: true
	},
	instrumentIndex: {
		type: Number,
		required: true
	},
	index: {
		type: Number,
		required: true
	}
})

let numberOfNote = computed(() => {
	return `'${props.index + 1}'`
})

let numberOfNote2 = computed(() => {
	return `'${props.index + 2}'`
})

let incrementNote = (note: number) => {
	if (songStore.instruments[props.instrumentIndex].possibleNotes[note + 1] === undefined) {
		return 0
	} else {
		return note + 1;
	}
}

let songStore = useSongStore()

let getIconName = (index: number, note: number) => {
	return songStore.instruments[index].possibleNotes[note].icon || null
}

let actualNotePlaying = ref<boolean | null | number>(null)

let changeColor = (lightTime: number, note?: number) => {
	actualNotePlaying.value = note ?? true;

	setTimeout(() => {
		actualNotePlaying.value = null;
	}, lightTime);

}

let emit = defineEmits(['update:note'])

const LONG_PRESS_MS = 450
let longPressTimeout: ReturnType<typeof setTimeout> | null = null
let longPressTriggered = ref(false)

let clearLongPressTimeout = () => {
	if (longPressTimeout) {
		clearTimeout(longPressTimeout)
		longPressTimeout = null
	}
}

let handleMainNoteClick = () => {
	if (longPressTriggered.value) {
		longPressTriggered.value = false
		return
	}

	if (!Array.isArray(props.note)) {
		emit('update:note', incrementNote(props.note))
	}
}

let handleSubNoteClick = (index: number) => {
	if (longPressTriggered.value) {
		longPressTriggered.value = false
		return
	}

	emit('update:note', changeNoteIndex(index))
}

let changeNoteType = (self?: Event) => {
	self?.preventDefault();

	if (Array.isArray(props.note)) {
		if (props.note.length < 4) {

			emit('update:note', [...props.note, 0])
		} else {
			emit('update:note', 0)

		}
	} else {
		emit('update:note', [props.note, 0])
	}
}

let handleTouchStart = () => {
	longPressTriggered.value = false
	clearLongPressTimeout()

	longPressTimeout = setTimeout(() => {
		longPressTriggered.value = true
		changeNoteType()
	}, LONG_PRESS_MS)
}

let handleTouchEnd = (event: TouchEvent) => {
	clearLongPressTimeout()

	if (longPressTriggered.value) {
		event.preventDefault()
	}
}

let handleTouchMove = () => {
	clearLongPressTimeout()
}

onBeforeUnmount(() => {
	clearLongPressTimeout()
})


let changeNoteIndex = (index: number) => {
	if (!Array.isArray(props.note)) {
		return props.note;
	}
	let temp = [...props.note];


	temp[index] = incrementNote(temp[index])
	return temp
}

defineExpose({
	changeColor
})
</script>

<style>
.defaultSubnotes-2 {
	grid-template-areas:
		"note0 note1"
		"note0 note1";
	grid-template-columns: repeat(2, minmax(0, 1fr));
	grid-template-rows: repeat(2, minmax(0, 1fr));
}

.defaultSubnotes-3 {
	grid-template-areas:
		"note0 note1"
		"note0 note2";
	grid-template-columns: repeat(2, minmax(0, 1fr));
	grid-template-rows: repeat(2, minmax(0, 1fr));
}

.defaultSubnotes-4 {
	grid-template-areas:
		"note0 note1"
		"note2 note3";
	grid-template-columns: repeat(2, minmax(0, 1fr));
	grid-template-rows: repeat(2, minmax(0, 1fr));
}

.note0 {
	grid-area: note0;
}

.defaultSubnotes-2 .note0,
.defaultSubnotes-3 .note0,
.defaultSubnotes-4 .note0 {
	--at-apply: border-r-1;
}

.defaultSubnotes-4 .note0 {
	--at-apply: border-b-1;
}

.note1 {
	grid-area: note1;
}

.defaultSubnotes-3 .note1,
.defaultSubnotes-4 .note1 {
	--at-apply: border-b-1;
}

.note2 {
	grid-area: note2;
}

.defaultSubnotes-4 .note2 {
	--at-apply: border-r-1;
}

.note3 {
	grid-area: note3;
}

.note.show-note::before {
	font-weight: 700;
	position: absolute;
	right: 4px;
	color: hsl(0, 0%, 0%, 20%);
}

.instrument.beat-4\/4 .note.show-note:nth-child(1):before {
	content: var(--numberOfNote, "1");
}

.instrument.beat-4\/4 .note.show-note:nth-child(2):before {
	content: "E";
}

.instrument.beat-4\/4 .note.show-note:nth-child(3):before {
	content: "Y";
}

.instrument.beat-4\/4 .note.show-note:nth-child(4):before {
	content: "A";
}


.instrument.beat-6\/8 .note.show-note:nth-child(1):before {
	content: var(--numberOfNote, "1");
}

.instrument.beat-6\/8 .note.show-note:nth-child(2):before {
	content: "E";
}

.instrument.beat-6\/8 .note.show-note:nth-child(3):before {
	content: "Y";
}

.instrument.beat-6\/8 .note.show-note:nth-child(4):before {
	content: var(--numberOfNote2, "1");
}

.instrument.beat-6\/8 .note.show-note:nth-child(5):before {
	content: "E";
}

.instrument.beat-6\/8 .note.show-note:nth-child(6):before {
	content: "Y";
}
</style>

<style>
.note.show-note {
	--numberOfNote: v-bind(numberOfNote);
}

.note.show-note {
	--numberOfNote2: v-bind(numberOfNote2);
}

.note,
.note * {
	-webkit-user-select: none;
	user-select: none;
}
</style>
