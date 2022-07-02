
<template>
	<div
		class="w-50px h-50px border-gray-600 border-1 grid note relative"
		:class="{
			'!border-red-600 z-2': actualNotePlaying === true,
			[`defaultSubnotes-${note?.length}`]: Array.isArray(note),
			'unique-note':note?.length === undefined ,
			'multi-note':note?.length !== undefined,
			'show-note': songStore.showNote
		}"
		@contextmenu="changeNoteType"
	>
		<div
			v-if="!Array.isArray(note)"
			class="w-full h-full"
			@click="$emit('update:note', incrementNote(note))"
		>
			<q-icon
				class="w-full h-full"
				:name="getIcon(instrumentIndex, note)"
			/>
		</div>
		<template v-else>
			<div
				v-for="(note, index) in props.note"
				:key="index"
				:class="[`note${index}`, typeof actualNotePlaying === 'number' && index === actualNotePlaying ? '!border-red-600':'']"
				class="flex justify-center items-center"

				@click="$emit('update:note', changeNoteIndex(index))"
			>
				<q-icon
					size="xs"
					:name="getIcon(instrumentIndex, note)"
				/>
			</div>
		</template>
	</div>
</template>

<script setup lang="ts">
import { useSongStore } from 'src/stores/songStore';
import { PropType, ref } from 'vue';

let getStartNote = (indexRow: number, indexGroup: number) => {
	return ((indexRow - 1) * beatsPerRow.value) + (props.beat.beatsPerBar * indexGroup)
}

const props = defineProps({
	note: {
		type: [Number, Array] as PropType<number | number[]>,
		required: true
	},
	instrumentIndex: {
		type: Number,
		required: true
	}
})

let incrementNote = (note: number) => {
	if (songStore.instruments[props.instrumentIndex].possibleNotes[note + 1] === undefined) {
		return 0
	} else {
		return note + 1;
	}
}

let songStore = useSongStore()

let getIcon = (index: number, note: number) => {
	return songStore.instruments[index].possibleNotes[note].icon
}

let actualNotePlaying = ref<boolean | null | number>(null)

let changeColor = (lightTime: number, note?: number) => {
	actualNotePlaying.value = note ?? true;

	setTimeout(() => {
		actualNotePlaying.value = null;
	}, lightTime);

}

let emit = defineEmits(['update:note'])

let changeNoteType = (self: Event) => {
	self.preventDefault();

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


let changeNoteIndex = (index: number) => {
	if (!Array.isArray(props.note)) {
		return props.note;
	}
	let temp = [...props.note];


	temp[index]  = incrementNote( temp[index])
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
}
.defaultSubnotes-3 {
    grid-template-areas:
        "note0 note1"
        "note0 note2";
}
.defaultSubnotes-4 {
    grid-template-areas:
        "note0 note1"
        "note2 note3";
}

.note0 {
    grid-area: note0;
}
.defaultSubnotes-2 .note0,
.defaultSubnotes-3 .note0,
.defaultSubnotes-4 .note0 {
    @apply border-r-1;
}
.defaultSubnotes-4 .note0 {
    @apply border-b-1;
}

.note1 {
    grid-area: note1;
}
.defaultSubnotes-3 .note1,
.defaultSubnotes-4 .note1 {
    @apply border-b-1;
}

.note2 {
    grid-area: note2;
}
.defaultSubnotes-4 .note2 {
    @apply border-r-1;
}

.note3 {
    grid-area: note3;
}

.note.show-note::before {
   font-weight: 700;
    position: absolute;
    right: 4px;
    color: hsl(0,0%,0%,20%);
}

.instrument.beat-4\/4 .note.show-note:nth-child(1):before {
    content: "1";
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
    content: "1";
}
.instrument.beat-6\/8 .note.show-note:nth-child(2):before {
    content: "E";
}
.instrument.beat-6\/8 .note.show-note:nth-child(3):before {
    content: "Y";
}
.instrument.beat-6\/8 .note.show-note:nth-child(4):before {
    content: "2";
}
.instrument.beat-6\/8 .note.show-note:nth-child(5):before {
    content: "E";
}
.instrument.beat-6\/8 .note.show-note:nth-child(6):before {
    content: "Y";
}
</style>
