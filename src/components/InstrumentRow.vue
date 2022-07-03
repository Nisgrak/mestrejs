
<template>
	<div class="instrument w-full">
		<div class="flex <md:justify-center items-center gap-3 mb-3">
			<q-input
				class="text-lg <md:w-full"
				input-class="<md:text-center"
				:model-value="instrument.alias"
				@update:model-value="emit('update:instrument', Object.assign(instrument, { alias: $event }))"
			/>
			<q-btn-group
				flat
				rounded
				unelevated
			>
				<q-btn
					:icon="mdiPlus"
					@click="addRow"
				/>
				<q-btn
					:icon="mdiMinus"
					@click="removeRow"
				/>
				<q-btn
					:icon="mdiTrashCan"
					@click="askDelete()"
				/>
			</q-btn-group>
			<q-knob
				:model-value="instrument.vol"
				show-value
				font-size="16px"
				size="40px"
				:thickness="0.25"
				track-color="grey-3"
				instant-feedback
				:min="0"
				:max="1"
				:step="0.01"
				@drag-value="emit('update:instrument', Object.assign(instrument, { vol: $event }))"
			>
				<div
					@click.stop.prevent="emit('update:instrument', Object.assign(instrument, { vol: 0 }))"
				>
					<q-icon
						:name="instrument.vol !== 0 ? mdiVolumeHigh: mdiVolumeMute"
					/>
				</div>
			</q-knob>
		</div>
		<div class="gap-10px grid grid-cols-1 w-full">
			<div
				v-for="indexRow in Math.ceil(instrument.notes.length / beatsPerRow)"
				:key="indexRow"
				class="gap-10px w-full grid grid-cols-1"
				:class="[`md:grid-cols-${beat.numOfGroups}`]"
			>
				<div
					v-for="(_, indexGroup) in beat.numOfGroups"
					:key="indexGroup"
					:style="{gridTemplateColumns: `repeat(${beat.beatsPerBar}, 49px)`}"
					class="grid justify-center"
				>
					<Note
						v-for="(note, indexNote) in instrument.notes.slice(getStartNote(indexRow, indexGroup), getStartNote(indexRow, indexGroup) + beat.beatsPerBar)"

						:ref="notesRefs.set"
						:key="indexNote"
						:note="instrument.notes[getStartNote(indexRow, indexGroup) + indexNote]"
						:instrument-index="instrument.type"
						@update:note="emit('update:instrument', Object.assign(instrument, { notes: instrument.notes.map((note, index) => index === (getStartNote(indexRow, indexGroup) + indexNote) ? $event : note)}))"
					/>
				</div>
			</div>
		</div>
	</div>
</template>
<script setup lang="ts">
import { Beat, Instrument } from 'stores/songStore';
import { computed, PropType, ref } from 'vue';
import Note from './NoteBox.vue';
import { mdiPlus, mdiMinus, mdiTrashCan, mdiVolumeHigh, mdiVolumeMute } from '@quasar/extras/mdi-v6'
import { useTemplateRefsList } from '@vueuse/core';
import { useQuasar } from 'quasar';

const props = defineProps({
	instrument: {
		type: Object as PropType<Instrument>,
		required: true
	},
	beat: {
		type: Object as PropType<Beat>,
		required: true
	}
})

let $q = useQuasar()


let askDelete = ()=> {
	$q.dialog({
		message: '¿Estás seguro que quieres eliminar este instrumento?',
		cancel: true
	}).onOk(() => {


		emit('remove')
	})

}

const notesRefs = useTemplateRefsList<InstanceType<typeof Note>>()

const emit = defineEmits(['update:instrument', 'remove'])

let addRow = () => {
	let temp = (new Array(props.beat.numOfGroups * props.beat.beatsPerBar)).fill(0);

	emit('update:instrument', { ...props.instrument, notes: props.instrument.notes.concat(temp) })
}
let removeRow = () => {
	let temp = props.instrument.notes;

	temp.splice(-(props.beat.numOfGroups * props.beat.beatsPerBar))

	emit('update:instrument', { ...props.instrument, notes: temp })
}

let beatsPerRow = computed(() => {
	return props.beat.beatsPerBar * props.beat.numOfGroups
});

let getStartNote = (indexRow: number, indexGroup: number) => {
	return ((indexRow - 1) * beatsPerRow.value) + (props.beat.beatsPerBar * indexGroup)
}

defineExpose({
	notesRefs
})
</script>

<style>
.note:first-child {
    @apply rounded-l-lg;
    @apply bg-gray-300;
}
.note:last-child {
    @apply rounded-r-lg;
}

.q-knob--editable:focus:before {
	box-shadow: none !important;
}
</style>
