<template>
	<div
		class="instrument w-full"
		:class="{ 'md:grid md:grid-cols-[560px_minmax(0,1fr)] md:items-start md:gap-x-3': horizontalView }"
	>
		<div
			:class="[
				'mb-3 flex w-full items-center gap-2 md:gap-3',
				horizontalView
					? 'min-h-11 flex-nowrap overflow-x-auto md:sticky md:left-0 md:z-30 md:!mb-0 md:w-[560px] md:bg-white md:px-3 md:py-2'
					: 'flex-wrap'
			]"
		>
			<UInput
				class="w-full text-base md:w-48"
				:class="horizontalView ? 'w-52 shrink-0' : ''"
				:model-value="instrument.alias"
				@update:model-value="emit('update:instrument', Object.assign(instrument, { alias: $event }))"
				aria-label="Nombre del instrumento"
			/>
			<div class="flex h-9 w-full items-center gap-1 rounded-md border border-slate-200 px-1 md:w-auto" :class="horizontalView ? 'w-auto shrink-0' : ''">
				<UTooltip text="Anadir fila">
					<UButton
						class="h-9 px-2"
						icon="i-lucide-plus"
						variant="ghost"
						@click="addRow"
						aria-label="Anadir fila"
					/>
				</UTooltip>
				<UTooltip text="Borrar fila">
					<UButton
						class="h-9 px-2"
						icon="i-lucide-minus"
						variant="ghost"
						@click="removeRow"
						aria-label="Borrar fila"
					/>
				</UTooltip>
				<UTooltip text="Configurar notas">
					<UButton
						class="h-9 px-2"
						icon="i-lucide-sliders-horizontal"
						variant="ghost"
						@click="showDialogNotes = true"
						aria-label="Configurar notas"
					/>
				</UTooltip>
				<UTooltip text="Borrar instrumento">
					<UButton
						class="h-9 px-2"
						icon="i-lucide-trash-2"
						variant="ghost"
						color="error"
						@click="askDelete()"
						aria-label="Borrar instrumento"
					/>
				</UTooltip>
			</div>
			<div class="flex w-full items-center gap-2 md:w-auto md:min-w-0" :class="horizontalView ? 'w-auto shrink-0' : ''">
				<UTooltip :text="instrument.vol !== 0 ? 'Silenciar instrumento' : 'Activar sonido'">
					<UButton
						class="h-9 px-2"
						:icon="instrument.vol !== 0 ? 'i-lucide-volume-2' : 'i-lucide-volume-x'"
						variant="ghost"
						:aria-label="instrument.vol !== 0 ? 'Silenciar instrumento' : 'Activar sonido'"
						@click="toggleMute"
					/>
				</UTooltip>
				<USlider
					class="min-w-0 flex-1 md:w-24 md:flex-none md:shrink-0"
					:model-value="instrument.vol"
					:min="0"
					:max="1"
					:step="0.01"
					aria-label="Volumen"
					@update:model-value="onVolumeInput"
				/>
				<span class="w-10 text-xs">{{ Math.round(instrument.vol * 100) }}</span>
			</div>
		</div>
		<div
			class="w-full gap-10px"
			:class="{ 'grid grid-cols-1': !horizontalView, 'grid grid-cols-1 overflow-x-auto md:flex md:flex-nowrap': horizontalView }"
		>
			<div
				v-for="(noteLine, indexRow) in instrument.noteLines"
				:key="indexRow"
				class="w-full gap-10px"
				:class="[`lg:grid-cols-${beat.numOfGroups}`, horizontalView ? 'flex w-max flex-nowrap md:w-auto' : 'grid grid-cols-1 justify-items-center']"
			>
				<div
					v-for="(group, indexGroup) in noteLine"
					:key="indexGroup"
					class="stack flex justify-center"
					:style="{ width: `${beat.beatsPerBar * 49}px` }"
				>
					<Note
						v-for="(note, indexNote) in group"
						:key="indexNote"
						:ref="notesRefs.set"
						:note="note"
						:index="(0 / beat.beatsPerBar) * (beat.name === '6/8' ? 2 : 1)"
						:instrument-index="instrument.type"
						@update:note="updateInstrument(indexRow, indexGroup, indexNote, $event)"
					/>
				</div>
			</div>
		</div>
		<UModal
			v-model:open="showDialogNotes"
			title="Cambio de compases"
			description="Ajusta los grupos de notas por linea."
		>
			<template #body>
				<UAlert
					color="error"
					variant="soft"
					title="Estos cambios son permanentes"
					description="No se pueden deshacer"
					class="mb-5"
				/>
				<div
					v-for="(noteLine, index) in instrument.noteLines"
					:key="index"
					class="mb-3"
				>
					<p class="mb-2">Linea {{ index + 1 }}</p>
					<div class="grid grid-cols-4 gap-5">
						<div
							v-for="(group, indexGroup) in noteLine"
							:key="indexGroup"
						>
							<label class="mb-1 block text-xs">Grupo {{ indexGroup + 1 }}</label>
							<input
								type="number"
								class="w-full rounded border border-slate-300 bg-white px-2 py-1"
								:value="group.length"
								@input="resizeGroup(index, indexGroup, $event)"
							/>
						</div>
					</div>
				</div>
				<div class="mt-4 flex justify-end">
					<UButton
						color="primary"
						@click="showDialogNotes = false"
					>OK</UButton>
				</div>
			</template>
		</UModal>

		<UModal
			v-model:open="showDeleteInstrumentModal"
			title="Borrar instrumento"
			description="Esta accion eliminara el instrumento de la seccion."
		>
			<template #body>
				<div class="grid gap-3">
					<p>¿Estás seguro que quieres eliminar este instrumento?</p>
					<div class="flex justify-end gap-2">
						<UButton
							color="neutral"
							variant="ghost"
							@click="showDeleteInstrumentModal = false"
						>Cancelar</UButton>
						<UButton
							color="error"
							@click="confirmDeleteInstrument"
						>Borrar</UButton>
					</div>
				</div>
			</template>
		</UModal>
	</div>
</template>

<script setup lang="ts">
import { type Beat, type Instrument } from '../stores/songStore'
import { computed, type PropType, ref } from 'vue'
import Note from './NoteBox.vue'
import { useTemplateRefsList } from '@vueuse/core'
import { generateNewLine } from '../utils/lines'

const props = defineProps({
	instrument: {
		type: Object as PropType<Instrument>,
		required: true
	},
	beat: {
		type: Object as PropType<Beat>,
		required: true
	},
	horizontalView: {
		type: Boolean,
		required: true
	}
})

let askDelete = () => {
	showDeleteInstrumentModal.value = true
}

let showDialogNotes = ref(false)
let showDeleteInstrumentModal = ref(false)
const notesRefs = useTemplateRefsList<InstanceType<typeof Note>>()
const emit = defineEmits(['update:instrument', 'remove'])

function confirmDeleteInstrument() {
	showDeleteInstrumentModal.value = false
	emit('remove')
}

let addRow = () => {
	emit('update:instrument', { ...props.instrument, noteLines: [...props.instrument.noteLines, generateNewLine(props.beat.numOfGroups, props.beat.beatsPerBar)] })
}

let removeRow = () => {
	let temp = props.instrument.noteLines
	temp.pop()
	emit('update:instrument', { ...props.instrument, noteLines: temp })
}

let beatsPerRow = computed(() => props.beat.beatsPerBar * props.beat.numOfGroups)

let getStartNote = (indexRow: number, indexGroup: number) => {
	return (indexRow - 1) * beatsPerRow.value + props.beat.beatsPerBar * indexGroup
}

function updateInstrument(indexRow: number, indexGroup: number, indexNote: number, newNote: number) {
	let temp = props.instrument.noteLines
	temp[indexRow][indexGroup][indexNote] = newNote
	emit('update:instrument', Object.assign(props.instrument, { noteLines: temp }))
}

function onVolumeInput(value: number | number[] | undefined) {
	if (typeof value !== 'number') {
		return
	}

	emit('update:instrument', Object.assign(props.instrument, { vol: value }))
}

function toggleMute() {
	const nextVolume = props.instrument.vol === 0 ? 1 : 0
	emit('update:instrument', Object.assign(props.instrument, { vol: nextVolume }))
}

function resizeGroup(index: number, indexGroup: number, event: Event) {
	const target = event.target as HTMLInputElement
	const value = Number.parseInt(target.value, 10)
	if (Number.isNaN(value) || value <= 0) {
		return
	}

	const group = props.instrument.noteLines[index][indexGroup]
	if (value > group.length) {
		group.push(...new Array(value - group.length).fill(0))
	} else if (value < group.length) {
		group.splice(value, group.length - value)
	}

	emit('update:instrument', Object.assign(props.instrument, { noteLines: props.instrument.noteLines }))
}

defineExpose({
	notesRefs
})
</script>

<style>
.note:first-child {
	--at-apply: rounded-l-lg;
	--at-apply: bg-gray-300;
}

.instrument.beat-6\/8 .note.show-note:nth-child(4) {
	--at-apply: bg-gray-100;
}

.note:last-child {
	--at-apply: rounded-r-lg;
}

.stack {
	--gap: -1px;
	display: flex;
	margin-bottom: calc(-1 * var(--gap));
	margin-left: calc(-1 * var(--gap));
}

.stack>* {
	margin-bottom: var(--gap);
	margin-left: var(--gap);
}
</style>
