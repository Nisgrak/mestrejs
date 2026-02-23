<template>
	<div
		class="instrument w-full"
		:class="{ 'md:grid md:w-max md:grid-cols-[600px_max-content] md:items-start md:gap-x-3': horizontalView }"
	>
		<div
			:class="[
				'mb-2 flex w-full items-center gap-2 md:gap-3',
				horizontalView
					? '-mt-2 min-h-11 flex-nowrap overflow-visible md:flex-nowrap md:!mb-0 md:w-[600px] md:bg-white md:px-3 md:py-2'
					: 'flex-wrap'
			]"
			ref="controlsRowRef"
		>
			<div
				:class="horizontalView
					? 'relative z-30 flex h-50px w-32 shrink-0 items-center bg-white md:w-52 md:flex-none md:shrink-0'
					: 'w-full md:w-48'"
				:style="aliasPinStyle"
				ref="aliasBoxRef"
			>
				<UInput
					class="my-auto w-full self-center text-base"
					:model-value="instrument.alias"
					@update:model-value="emit('update:instrument', Object.assign(instrument, { alias: $event }))"
					aria-label="Nombre del instrumento"
				/>
			</div>
			<div
				class="flex h-8 items-center gap-1 rounded-md border border-slate-200 px-1 md:h-9"
				:class="horizontalView ? 'relative z-10 w-auto shrink-0' : 'w-full md:w-auto'"
			>
				<UTooltip text="Anadir fila">
					<UButton
						class="h-8 px-1.5 md:h-9 md:px-2"
						icon="i-lucide-plus"
						variant="ghost"
						@click="addRow"
						aria-label="Anadir fila"
					/>
				</UTooltip>
				<UTooltip text="Borrar fila">
					<UButton
						class="h-8 px-1.5 md:h-9 md:px-2"
						icon="i-lucide-minus"
						variant="ghost"
						@click="removeRow"
						aria-label="Borrar fila"
					/>
				</UTooltip>
				<UTooltip text="Configurar notas">
					<UButton
						class="h-8 px-1.5 md:h-9 md:px-2"
						icon="i-lucide-sliders-horizontal"
						variant="ghost"
						@click="showDialogNotes = true"
						aria-label="Configurar notas"
					/>
				</UTooltip>
				<UTooltip text="Borrar instrumento">
					<UButton
						class="h-8 px-1.5 md:h-9 md:px-2"
						icon="i-lucide-trash-2"
						variant="ghost"
						color="error"
						@click="askDelete()"
						aria-label="Borrar instrumento"
					/>
				</UTooltip>
			</div>
			<div
				class="flex items-center gap-1.5 md:min-w-0 md:gap-2"
				:class="horizontalView ? 'relative z-10 w-28 shrink-0 md:w-auto' : 'w-full md:w-auto'"
			>
				<UTooltip :text="instrument.vol !== 0 ? 'Silenciar instrumento' : 'Activar sonido'">
					<UButton
						class="h-8 px-1.5 md:h-9 md:px-2"
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
				<span class="w-7 text-right text-xs">{{ Math.round(instrument.vol * 100) }}</span>
			</div>
		</div>
		<div
			class="w-full gap-10px"
			ref="notesScrollContainerRef"
			@scroll.passive="onNotesScroll"
			:class="{ 'grid grid-cols-1': !horizontalView, 'relative z-20 flex flex-nowrap overflow-x-auto md:overflow-visible': horizontalView }"
		>
			<div
				v-for="(noteLine, indexRow) in instrument.noteLines"
				:key="indexRow"
				class="gap-10px"
				:class="[`lg:grid-cols-${beat.numOfGroups}`, horizontalView ? 'flex shrink-0 flex-nowrap' : 'grid w-full grid-cols-1 justify-items-center']"
			>
				<div
					v-for="(group, indexGroup) in noteLine"
					:key="indexGroup"
					class="stack flex shrink-0 justify-center"
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
import { computed, nextTick, onBeforeUnmount, onMounted, type CSSProperties, type PropType, ref, watch } from 'vue'
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
	},
	syncNotesScroll: {
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
const notesScrollContainerRef = ref<HTMLElement | null>(null)
const controlsRowRef = ref<HTMLElement | null>(null)
const aliasBoxRef = ref<HTMLElement | null>(null)
const emit = defineEmits(['update:instrument', 'remove', 'notes-scroll'])
const syncingScroll = ref(false)
const aliasViewportOffset = ref(0)
let aliasScrollTarget: HTMLElement | null = null
const ALIAS_LEFT_BLEED_PX = 12

const aliasPinStyle = computed<CSSProperties | undefined>(() => {
	if (!props.horizontalView) {
		return undefined
	}

	return {
		transform: `translateX(${aliasViewportOffset.value}px)`
	}
})

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

function onNotesScroll() {
	const scrollContainer = resolveNotesScrollContainer()
	if (!props.syncNotesScroll || syncingScroll.value || !scrollContainer) {
		return
	}

	emit('notes-scroll', scrollContainer.scrollLeft)
}

function setNotesScrollLeft(scrollLeft: number) {
	const scrollContainer = resolveNotesScrollContainer()
	if (!scrollContainer) {
		return
	}

	if (Math.abs(scrollContainer.scrollLeft - scrollLeft) < 1) {
		return
	}

	syncingScroll.value = true
	scrollContainer.scrollLeft = scrollLeft
	updateAliasViewportOffset()

	requestAnimationFrame(() => {
		syncingScroll.value = false
	})
}

function scrollToNote(noteIndex: number, syncFollowers = false, force = false) {
	const scrollContainer = resolveNotesScrollContainer()
	if (!scrollContainer || !notesScrollContainerRef.value) {
		return
	}

	const noteComponent = notesRefs.value[noteIndex] as { $el?: HTMLElement } | undefined
	const noteElement = noteComponent?.$el

	if (!noteElement) {
		return
	}

	const visibleLeft = scrollContainer.scrollLeft
	const visibleRight = scrollContainer.scrollLeft + scrollContainer.clientWidth
	const containerRect = scrollContainer.getBoundingClientRect()
	const noteRect = noteElement.getBoundingClientRect()
	const noteLeft = noteRect.left - containerRect.left + scrollContainer.scrollLeft
	const noteRight = noteLeft + noteElement.offsetWidth
	const padding = 24
	const leftOcclusion = getLeftOcclusionWidth()
	const leftSafeZone = padding + leftOcclusion
	let nextScrollLeft = visibleLeft

	if (force) {
		nextScrollLeft = Math.max(0, noteLeft - leftSafeZone)
	}

	if (!force) {
		if (noteLeft < visibleLeft + leftSafeZone) {
			nextScrollLeft = Math.max(0, noteLeft - leftSafeZone)
		} else if (noteRight > visibleRight - padding) {
			nextScrollLeft = Math.max(0, noteRight - scrollContainer.clientWidth + padding)
		}
	}

	const maxScrollLeft = Math.max(0, scrollContainer.scrollWidth - scrollContainer.clientWidth)
	nextScrollLeft = Math.min(nextScrollLeft, maxScrollLeft)

	if (Math.abs(scrollContainer.scrollLeft - nextScrollLeft) < 1) {
		return
	}

	syncingScroll.value = true
	scrollContainer.scrollLeft = nextScrollLeft
	updateAliasViewportOffset()

	if (syncFollowers && props.syncNotesScroll) {
		emit('notes-scroll', nextScrollLeft)
	}

	requestAnimationFrame(() => {
		syncingScroll.value = false
	})
}

function resolveNotesScrollContainer(): HTMLElement | null {
	if (!notesScrollContainerRef.value) {
		return null
	}

	const rowContainer = notesScrollContainerRef.value
	const desktopScrollRoot = rowContainer.closest('[data-notes-scroll-root]') as HTMLElement | null
	const rowScrollable = rowContainer.scrollWidth - rowContainer.clientWidth > 1
	const rootScrollable = !!desktopScrollRoot && desktopScrollRoot.scrollWidth - desktopScrollRoot.clientWidth > 1

	if (props.syncNotesScroll) {
		if (rowScrollable) {
			return rowContainer
		}

		if (rootScrollable && desktopScrollRoot) {
			return desktopScrollRoot
		}

		return rowContainer
	}

	return desktopScrollRoot ?? rowContainer
}

function handleAliasScroll() {
	updateAliasViewportOffset()
}

function unbindAliasScroll() {
	if (!aliasScrollTarget) {
		return
	}

	aliasScrollTarget.removeEventListener('scroll', handleAliasScroll)
	aliasScrollTarget = null
}

function bindAliasScroll() {
	unbindAliasScroll()
	aliasViewportOffset.value = 0

	if (!props.horizontalView) {
		return
	}

	nextTick(() => {
		const target = resolveNotesScrollContainer()
		if (!target) {
			return
		}

		aliasScrollTarget = target
		updateAliasViewportOffset()
		target.addEventListener('scroll', handleAliasScroll, { passive: true })
	})
}

function updateAliasViewportOffset() {
	if (!props.horizontalView || !controlsRowRef.value || !aliasBoxRef.value || !notesScrollContainerRef.value) {
		aliasViewportOffset.value = 0
		return
	}

	const aliasRect = aliasBoxRef.value.getBoundingClientRect()
	const naturalAliasLeft = aliasRect.left - aliasViewportOffset.value
	const naturalAliasRight = naturalAliasLeft + aliasRect.width
	const shouldPinToViewportLeft = naturalAliasLeft <= ALIAS_LEFT_BLEED_PX

	const firstNoteElement = notesScrollContainerRef.value.querySelector('.note') as HTMLElement | null
	const willCollideWithNotes = firstNoteElement
		? firstNoteElement.getBoundingClientRect().left <= naturalAliasRight
		: false

	if (!shouldPinToViewportLeft && !willCollideWithNotes) {
		aliasViewportOffset.value = 0
		return
	}

	aliasViewportOffset.value = -(controlsRowRef.value.getBoundingClientRect().left + ALIAS_LEFT_BLEED_PX)
}

function getLeftOcclusionWidth() {
	if (!props.horizontalView || !aliasBoxRef.value) {
		return 0
	}

	return aliasBoxRef.value.getBoundingClientRect().width
}

function handleWindowResize() {
	updateAliasViewportOffset()
}

watch(() => [props.horizontalView, props.syncNotesScroll], bindAliasScroll, { immediate: true })

onMounted(() => {
	if (typeof window === 'undefined') {
		return
	}

	window.addEventListener('resize', handleWindowResize)
	window.addEventListener('orientationchange', handleWindowResize)
	nextTick(() => {
		updateAliasViewportOffset()
	})
})

onBeforeUnmount(() => {
	unbindAliasScroll()
	if (typeof window !== 'undefined') {
		window.removeEventListener('resize', handleWindowResize)
		window.removeEventListener('orientationchange', handleWindowResize)
	}
})

defineExpose({
	notesRefs,
	setNotesScrollLeft,
	scrollToNote
})
</script>

<style>
.note:first-child {
	--at-apply: rounded-l-lg bg-gray-300;
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
