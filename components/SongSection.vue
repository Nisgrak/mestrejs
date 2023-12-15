<template>
	<div v-if="section" class="section w-full border-1 p-5 rounded-lg flex flex-col">
		<div class="flex flex-nowrap">
			<div class="flex items-center lt-md:justify-center gap-3 mb-5" :class="{
				'sticky left-5 flex-nowrap bg-white z-2': songStore.horizontalView
			}">
				<q-input class="text-xl font-medium lt-md:w-full" input-class="lt-md:text-center"
					:model-value="section.name"
					@update:model-value="emit('update:section', Object.assign(section, { name: $event }))"
					aria-label="Nombre de la sección" />
				<q-btn class="self-center" color="secondary" unelevated :disabled="section.instruments.length == 0"
					:icon="playing ? mdiStop : mdiPlay" @click="playing ? pause() : play()"
					:aria-label="playing ? 'Pausar reproducción' : 'Reproducir sección'" />

				<q-btn-group flat rounded unelevated>
					<q-btn :icon="mdiPlus" @click="addInstrument" aria-label="Añadir instrumento" />
					<q-btn :icon="mdiFractionOneHalf" aria-label="Cambiar compás">
						<q-menu anchor="bottom left" self="top left" transition-show="jump-down" transition-hide="jump-up">
							<div class="row q-pa-md q-gutter-sm">
								<q-btn v-for="(beat, index) in songStore.beats" :key="index" v-close-popup outline
									unelevated color="secondary" :disabled="section.beat.name === beat.name"
									@click="changeBeat(beat)" :aria-label="`Cambiar compás a ${beat.name}`">
									{{ beat.name }}
								</q-btn>
							</div>
						</q-menu>
					</q-btn>
					<q-btn :icon="mdiContentCopy" @click="emit('duplicate')" aria-label="Duplicar sección" />
					<q-btn :icon="mdiTrashCan" @click="askDelete" aria-label="Borrar sección" />
				</q-btn-group>
			</div>
			<div class="flex-grow" />
		</div>

		<div>
			<InstrumentRow v-for="(instrument, indexInstrument) in section.instruments" :ref="instrumentsRefs.set"
				:key="instrument.id" :instrument="section.instruments[indexInstrument]" :beat="section.beat"
				:class="[`beat-${section.beat.name}`]"
				@update:instrument="emit('update:section', Object.assign(section, { instruments: section.instruments.map((instrument, index) => index === indexInstrument ? $event : instrument) }))"
				@remove="emit('update:section', Object.assign(section, { instruments: section.instruments.filter((_, index) => index !== indexInstrument) }))" />
		</div>
	</div>
</template>

<script lang="ts" setup>
import { type Beat, type Section } from '../stores/songStore';
import InstrumentRow from './InstrumentRow.vue';
import { type PropType, ref } from 'vue';
import { mdiPlay, mdiPlus, mdiStop, mdiTrashCan, mdiFractionOneHalf, mdiContentCopy } from '@quasar/extras/mdi-v6';
import { useTemplateRefsList } from '@vueuse/core'
import NoteBoxVue from './NoteBox.vue';
import SelectInstrumentDialog from './SelectInstrumentDialog.vue';
import { Howl } from 'howler';
import { uid, useQuasar } from 'quasar';
import { generateNewLine } from '../utils/lines'

let songStore = useSongStore()
let playing = ref(false)

let $q = useQuasar()
const instrumentsRefs = useTemplateRefsList<InstanceType<typeof InstrumentRow>>()

let getPlayingLength = () => {
	return getTimeOfNote() * getMaxNote();
}
let getTimeOfNote = (groups = props.section.beat.beatsPerBar) => {
	return 60000 / songStore.bpm / groups;
}

let changeBeat = async (newBeat: Beat) => {

	$q.dialog({
		message: 'Vas a perder todas las notas de esta sección, ¿estás seguro?',
		title: 'Cambio de compás',
		cancel: true,
	}).onOk(() => {

		emit('update:section', Object.assign(props.section, { beat: newBeat }))

		for (const instrumentIndex in props.section.instruments) {

			let instrument = props.section.instruments[instrumentIndex];

			instrument.noteLines = [generateNewLine(props.section.beat.numOfGroups, props.section.beat.beatsPerBar)];
		}
	})


}

let askDelete = () => {
	$q.dialog({
		message: '¿Estás seguro que quieres eliminar este instrumento?',
		cancel: true
	}).onOk(() => {


		emit('remove')
	})

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
		let howls = songStore.getPossibleNotes(instrument.type);
		let accTime = 0
		let noteInInstrument = 0
		for (let indexLine = 0; indexLine < instrument.noteLines.length; indexLine++) {
			let noteInLine = 0
			for (let indexGroup = 0; indexGroup < instrument.noteLines[indexLine].length; indexGroup++) {
				let timeOfgroup = getTimeOfNote(instrument.noteLines[indexLine][indexGroup].length)
				for (let indexNote = 0; indexNote < instrument.noteLines[indexLine][indexGroup].length; indexNote++) {
					const note = instrument.noteLines[indexLine][indexGroup][indexNote]

					let boxElement = instrumentsRefs.value[indexInstrument].notesRefs[noteInInstrument];


					// Nota con subidivisiones
					if (Array.isArray(note)) {
						let noteLong = timeOfgroup / note.length

						for (let indexSubNote = 0; indexSubNote < note.length; indexSubNote++) {

							let sound = howls[note[indexSubNote]].howls;

							playNote(accTime, sound, instrument.vol, boxElement, noteLong, indexSubNote);
							accTime += noteLong

						}

					} else { // Nota sin subdivision

						let sound = howls[note].howls;

						playNote(accTime, sound, instrument.vol, boxElement, timeOfgroup);
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

let playNote = (time: number, sound: Howl | undefined, volume: number, element: InstanceType<typeof NoteBoxVue>, lightTime: number, subNote: number | undefined = undefined) => {
	instrumentsSoundsList.value.push(setTimeout(() => {
		if (sound) {
			sound.volume(volume);
			sound.play();
		}

		element.changeColor(lightTime, subNote);
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

let createInstrument = (indexInstrument: number) => {

	emit('update:section', Object.assign(props.section, {
		instruments: [
			...props.section.instruments, {
				alias: songStore.instruments[indexInstrument].name,
				id: uid(),
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
	}
})

let emit = defineEmits(['update:section', 'remove', 'duplicate'])

defineExpose({
	getPlayingLength,
	play,
	pause,
	idSection: () => props.section.id
})
</script>

<style></style>
