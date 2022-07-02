<template>
	<div
		v-if="section"
		class="section w-full border-1 p-5 rounded-lg"
	>
		<div class="flex items-center gap-3">
			<div class="text-xl font-medium">
				{{ section.name }}
			</div>
			<q-btn
				:icon="mdiPlay"
				round
				flat
				@click="play"
			/>
			<q-btn
				:icon="mdiPlus"
				round
				flat
				@click="addInstrument"
			/>
		</div>
		<div>
			<InstrumentRow
				v-for="(instrument, indexInstrument) in section.instruments"
				:ref="instrumentsRefs.set"
				:key="instrument.id"
				:instrument="section.instruments[indexInstrument]"
				:beat="section.beat"
				@update:instrument="emit('update:section', Object.assign(section, { instruments: section.instruments.map((instrument, index) => index === indexInstrument ? $event : instrument)}))"
				@remove="emit('update:section', Object.assign(section, { instruments: section.instruments.filter((_, index) => index !== indexInstrument)}))"
			/>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { Section, useSongStore } from 'stores/songStore';
import InstrumentRow from './InstrumentRow.vue';
import { PropType, ref } from 'vue';
import { mdiPlay, mdiPlus } from '@quasar/extras/mdi-v6';
import { useTemplateRefsList } from '@vueuse/core'
import NoteBoxVue from './NoteBox.vue';
import SelectInstrumentDialog from './SelectInstrumentDialog.vue';
import { Howl } from 'howler';
import { uid, useQuasar } from 'quasar';
import { store } from 'quasar/wrappers';

let songStore= useSongStore()
let playing = ref(false)

let $q = useQuasar()
const instrumentsRefs = useTemplateRefsList<InstanceType<typeof InstrumentRow>>()

let getPlayingLength = ()=> {
	return getTimeOfNote() * getMaxNote();
}
let getTimeOfNote = ()=> {
	return 60000 / songStore.bpm / props.section.beat.numOfGroups;
}

let getMaxNote=() => {
	let maxNote = 0;

	for (let indexInstrument = 0; indexInstrument < props.section.instruments.length; indexInstrument++) {
		let instrument = props.section.instruments[indexInstrument];

		if (instrument.notes.length > maxNote) {
			maxNote = instrument.notes.length;
		}
	}
	return maxNote;
}


let play = (internalPlay = true) => {
	playing.value = true;
	songStore.playing = true;
	// this.$emit("playing");

	let time = getTimeOfNote();
	for (let indexInstrument = 0; indexInstrument < props.section.instruments.length; indexInstrument++) {
		let instrument = props.section.instruments[indexInstrument];
		let howls = songStore.getPossibleNotes(instrument.type);
		let notesPerLine = instrument.notes.length / instrument.lines;

		for (let indexNote = 0; indexNote < instrument.notes.length; indexNote++) {
			let actualLine = Math.floor(indexNote / notesPerLine);
			let noteInLine = indexNote - (actualLine * notesPerLine);
			let boxElement = instrumentsRefs.value[indexInstrument].notesRefs[noteInLine];

			let note = instrument.notes[indexNote];

			// Nota con subidivisiones
			if (Array.isArray(note)) {
				for (let indexSubNote = 0; indexSubNote < note.length; indexSubNote++) {

					let noteTime = time * (indexNote + ((1 / note.length) * indexSubNote));
					let sound = howls[note[indexSubNote]].howls;

					playNote(noteTime, sound, instrument.vol, boxElement, time, indexSubNote);
				}

			} else { // Nota sin subdivision
				let noteTime = time * indexNote;
				let sound = howls[note].howls;

				playNote(noteTime, sound, instrument.vol, boxElement, time);
			}
		}
	}
	if (internalPlay && songStore.repeat) {
		instrumentsSoundsList.value.push(
			setTimeout(() => {
				play();
			}, time * getMaxNote())
		);
	} else {
		instrumentsSoundsList.value.push(
			setTimeout(() => {
				instrumentsSoundsList.value = [];
				playing.value = false;
				songStore.playing = false;

				// this.$emit('pauseRepeat');

			}, time * getMaxNote() - 10)
		);
	}
}

let playNote = (time: number, sound: Howl | undefined, volume: number, element: InstanceType<typeof NoteBoxVue>, lightTime: number, subNote: number | undefined = undefined) =>{
	instrumentsSoundsList.value.push(setTimeout(() => {
		if (sound) {
			sound.volume(volume);
			sound.play();
		}

		element.changeColor(lightTime, subNote);
	}, time));
}
let pause = ()=> {
	instrumentsSoundsList.value.forEach(instrument => clearTimeout(instrument));

	instrumentsSoundsList.value = [];
	playing.value = false;
	songStore.playing = false;

	// this.$emit('pause');

}



let instrumentsSoundsList = ref< ReturnType<typeof setTimeout>[]>([])
let addInstrument = () => {
	$q.dialog({
		component: SelectInstrumentDialog,

		// props forwarded to your custom component
		componentProps: {
			text: 'something',
			// ...more..props...
		}
	}).onOk(({ instrument }) => {
		createInstrument(instrument)
	}).onCancel(() => {
		console.log('Cancel')
	}).onDismiss(() => {
		console.log('Called on OK or Cancel')
	})
}

let createInstrument = (indexInstrument: number ) => {
	emit('update:section', Object.assign(props.section, {
		instruments: [
			...props.section.instruments, {
				alias: songStore.instruments[indexInstrument].name,
				id: uid(),
				lines: 1,
				vol: 1,
				type: indexInstrument,
				notes:  (new Array(props.section.beat.numOfGroups * props.section.beat.beatsPerBar)).fill(0)

			}
		]
	})
	)
}


let props = defineProps({
	section: {
		type: Object as PropType<Section>,
		required: true,
	}
})

let emit = defineEmits(['update:section'])

defineExpose({
	getPlayingLength,
	play,
	pause
})
</script>

<style>
</style>
