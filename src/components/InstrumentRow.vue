
<template>
	<div
		class="instrument w-full"
		:class="{
			'grid grid-cols-[500px,6fr]': songStore.horizontalView
		}"
	>
		<div
			class="flex <md:justify-center items-center gap-3 mb-3"
			:class="{
				'sticky left-0 flex-nowrap bg-white z-2 w-full pl-10': songStore.horizontalView
			}"
		>
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
				<q-btn
					:icon="mdiFractionOneHalf"
					@click="showDialogNotes = true"
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
		<div
			class="gap-10px w-full"
			:class="{
				'grid grid-cols-1': !songStore.horizontalView,
				'flex flex-nowrap': songStore.horizontalView
			}"
		>
			<div
				v-for="noteLine, indexRow in instrument.noteLines"
				:key="indexRow"
				class="gap-10px w-full "
				:class="[
					`md:grid-cols-${beat.numOfGroups}`,
					songStore.horizontalView ? 'flex flex-nowrap': 'grid grid-cols-1'
				]"
			>
				<div
					v-for="(group, indexGroup) in noteLine"
					:key="indexGroup"
					:style="{gridTemplateColumns: `repeat(${beat.beatsPerBar}, 49px)`}"
					class="grid justify-center"
				>
					<Note
						v-for="(note, indexNote) in group"

						:ref="notesRefs.set"
						:key="indexNote"
						:note="note"
						:index="(0 / beat.beatsPerBar) * (beat.name === '6/8'? 2: 1)"
						:instrument-index="instrument.type"
						@update:note="updateInstrument(indexRow, indexGroup, indexNote, $event)"
					/>
				</div>
			</div>
		</div>
		<q-dialog
			v-model="showDialogNotes"
		>
			<q-card>
				<q-card-section>
					<div class="text-h6">
						Cambio de compases
					</div>
				</q-card-section>

				<q-card-section class="q-pt-none">
					<q-banner
						class="bg-negative text-white mb-5"
						rounded
					>
						<template #avatar>
							<q-icon
								:name="mdiAlert"
							/>
						</template>
						Estos cambios son permanentes, no se pueden deshacer
					</q-banner>
					<div
						v-for="(noteLine,index) in instrument.noteLines"
						:key="index"
					>
						Línea {{ index + 1 }}
						<div class="grid grid-cols-4 gap-5">
							<div
								v-for="(group, indexGroup) in noteLine"
								:key="indexGroup"
							>
								<q-input
									:label="`Grupo ${indexGroup + 1}`"
									:model-value="group.length"
									type="number"
									debounce="500"
									@update:model-value="$event === null ? null: parseInt($event as string) > group.length ? group.push(...(new Array(parseInt($event as string) - group.length).fill(0))): group.splice(group.length - (group.length - parseInt($event as string)), group.length - parseInt($event as string))"
								/>
							</div>
						</div>
					</div>
				</q-card-section>

				<q-card-actions align="right">
					<q-btn
						v-close-popup
						flat
						label="OK"
						color="primary"
					/>
				</q-card-actions>
			</q-card>
		</q-dialog>
	</div>
</template>
<script setup lang="ts">
import { Beat, Instrument, useSongStore } from 'stores/songStore';
import { computed, PropType, ref } from 'vue';
import Note from './NoteBox.vue';
import { mdiPlus, mdiMinus, mdiTrashCan, mdiVolumeHigh, mdiVolumeMute, mdiFractionOneHalf, mdiAlert } from '@quasar/extras/mdi-v6'
import { useTemplateRefsList } from '@vueuse/core';
import { useQuasar } from 'quasar';
import { generateNewLine } from 'src/utils/lines';

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

let showDialogNotes = ref(false)

const notesRefs = useTemplateRefsList<InstanceType<typeof Note>>()

const emit = defineEmits(['update:instrument', 'remove'])

let addRow = () => {

	emit('update:instrument', { ...props.instrument, noteLines: [...props.instrument.noteLines, generateNewLine(props.beat.numOfGroups, props.beat.beatsPerBar)] })
}
let removeRow = () => {
	let temp = props.instrument.noteLines;

	temp.pop()

	emit('update:instrument', { ...props.instrument, noteLines: temp })
}

let beatsPerRow = computed(() => {
	return props.beat.beatsPerBar * props.beat.numOfGroups
});

let getStartNote = (indexRow: number, indexGroup: number) => {
	return ((indexRow - 1) * beatsPerRow.value) + (props.beat.beatsPerBar * indexGroup)
}

let songStore = useSongStore()

function updateInstrument(indexRow: number, indexGroup: number, indexNote: number, newNote: number) {
	let temp = props.instrument.noteLines
	temp[indexRow][indexGroup][indexNote] = newNote;

	console.log(props.instrument.noteLines);
	console.log(indexGroup, indexNote, newNote);

	emit('update:instrument', Object.assign(props.instrument, { noteLine: temp }))
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

.instrument.beat-6\/8 .note.show-note:nth-child(4) {
    @apply bg-gray-100;

}

.note:last-child {
    @apply rounded-r-lg;
}

.q-knob--editable:focus:before {
	box-shadow: none !important;
}
</style>
