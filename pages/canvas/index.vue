<template>
	<div class="overflow-x-clip">
		<div class="screen-only">
			<div class="sticky top-0 z-40 border-b border-default bg-white shadow-sm">
				<div
					class="flex w-full items-center bg-white px-2 py-2 md:justify-center md:gap-3 md:px-5"
					:class="isMobileLandscape ? 'flex-nowrap gap-1 overflow-x-auto' : 'flex-wrap gap-2'"
				>
					<div
						class="flex items-center md:w-auto md:flex-nowrap"
						:class="isMobileLandscape ? 'w-auto shrink-0 flex-nowrap gap-1' : 'w-full flex-wrap gap-2'"
					>
						<UTooltip
							v-if="isMobileLandscape"
							:text="mobileSidePanelOpen ? 'Cerrar panel lateral' : 'Abrir panel lateral'"
						>
							<UButton
								:color="mobileSidePanelOpen ? 'primary' : 'neutral'"
								size="md"
								class="h-9"
								:variant="mobileSidePanelOpen ? 'solid' : 'outline'"
								icon="i-lucide-panel-left"
								@click="toggleMobileSidePanel"
								:aria-label="mobileSidePanelOpen ? 'Cerrar panel lateral' : 'Abrir panel lateral'"
							>
								Panel
							</UButton>
						</UTooltip>
						<UTooltip :text="playing ? 'Pausar reproducción' : 'Reproducir canción'">
							<UButton
								color="primary"
								size="md"
								class="h-9"
								:disabled="displaySections.length === 0"
								:icon="playing ? 'i-lucide-square' : 'i-lucide-play'"
								@click="playing ? pause() : play()"
								:aria-label="playing ? 'Pausar reproducción' : 'Reproducir canción'"
							/>
						</UTooltip>

						<UTooltip :text="songStore.repeat ? 'Desactivar repeticion' : 'Activar repeticion'">
							<UButton
								:color="songStore.repeat ? 'primary' : 'neutral'"
								size="md"
								class="h-9"
								variant="outline"
								icon="i-lucide-repeat"
								@click="songStore.repeat = !songStore.repeat"
								:aria-label="songStore.repeat ? 'Desactivar repeticion' : 'Activar repeticion'"
							/>
						</UTooltip>

						<UTooltip :text="songStore.showNote ? 'Ocultar notas' : 'Mostrar notas'">
							<UButton
								:color="songStore.showNote ? 'primary' : 'neutral'"
								size="md"
								class="h-9"
								variant="outline"
								icon="i-lucide-hash"
								@click="songStore.showNote = !songStore.showNote"
								:aria-label="songStore.showNote ? 'Ocultar notas' : 'Mostrar notas'"
							/>
						</UTooltip>
						<UTooltip
							v-if="!isMobileViewport"
							:text="songStore.horizontalView ? 'Vista vertical' : 'Vista horizontal'"
						>
							<UButton
								:color="songStore.horizontalView ? 'primary' : 'neutral'"
								size="md"
								class="h-9"
								variant="outline"
								icon="i-lucide-layout-grid"
								@click="songStore.horizontalView = !songStore.horizontalView"
								:aria-label="songStore.horizontalView ? 'Vista vertical' : 'Vista horizontal'"
							/>
						</UTooltip>

						<div class="flex h-9 items-center rounded-md border border-default">
							<UTooltip text="Guardar canción">
								<UButton
									size="md"
									class="h-9"
									icon="i-lucide-save"
									variant="ghost"
									@click="saveSong(true)"
									aria-label="Guardar canción"
								/>
							</UTooltip>
							<UTooltip text="Borrar notas">
								<UButton
									size="md"
									class="h-9"
									icon="i-lucide-eraser"
									variant="ghost"
									@click="clearNotes()"
									aria-label="Borrar notas"
								/>
							</UTooltip>
							<UTooltip text="Insertar canción">
								<UButton
									size="md"
									class="h-9"
									icon="i-lucide-code"
									variant="ghost"
									@click="insert()"
									aria-label="Insertar canción"
								/>
							</UTooltip>
							<UTooltip text="Imprimir composición en PDF">
								<UButton
									size="md"
									class="h-9"
									icon="i-lucide-printer"
									variant="ghost"
									@click="printCompositionPdf"
									aria-label="Imprimir composición en PDF"
								/>
							</UTooltip>
						</div>

					</div>

					<div
						class="flex items-center md:w-auto"
						:class="isMobileLandscape ? 'w-auto shrink-0 gap-1' : 'w-full gap-2'"
					>
						<UInput
							v-model="songStore.name"
							size="md"
							:ui="{ base: 'h-9' }"
							:class="isMobileLandscape ? 'w-40' : 'min-w-0 flex-1 md:w-72 md:flex-none'"
							placeholder="Partitura"
						/>
						<UInput
							v-model="songStore.bpm"
							size="md"
							:ui="{ base: 'h-9 text-center' }"
							:class="isMobileLandscape ? 'w-16' : 'w-24'"
							placeholder="BPM"
							type="number"
						/>
					</div>
				</div>
				<div
					v-if="isMobileViewport && !isMobileLandscape"
					class="border-t border-default bg-white px-2 py-2"
				>
					<div class="grid grid-cols-3 gap-2">
						<UButton
							:variant="mobileActivePanel === 'library' ? 'solid' : 'outline'"
							:color="mobileActivePanel === 'library' ? 'primary' : 'neutral'"
							size="sm"
							@click="mobileActivePanel = 'library'"
						>
							<span class="inline-flex items-center gap-1">
								<span>Biblioteca</span>
								<UBadge
									size="xs"
									variant="soft"
									color="neutral"
								>{{ songStore.sectionLibrary.length }}</UBadge>
							</span>
						</UButton>
						<UButton
							:variant="mobileActivePanel === 'composition' ? 'solid' : 'outline'"
							:color="mobileActivePanel === 'composition' ? 'primary' : 'neutral'"
							size="sm"
							@click="mobileActivePanel = 'composition'"
						>
							<span class="inline-flex items-center gap-1">
								<span>Compositor</span>
								<UBadge
									size="xs"
									variant="soft"
									color="neutral"
								>{{ songStore.arrangement.length }}</UBadge>
							</span>
						</UButton>
						<UButton
							:variant="mobileActivePanel === 'editor' ? 'solid' : 'outline'"
							:color="mobileActivePanel === 'editor' ? 'primary' : 'neutral'"
							size="sm"
							@click="mobileActivePanel = 'editor'"
						>
							<span class="inline-flex items-center gap-1">
								<span>Editor</span>
								<UBadge
									size="xs"
									variant="soft"
									color="neutral"
								>{{ selectedSectionInstrumentsCount }}</UBadge>
							</span>
						</UButton>
					</div>
				</div>
			</div>

			<div
				v-if="isMobileLandscape && mobileSidePanelOpen"
				class="fixed inset-0 z-40 bg-black/30"
				@click="mobileSidePanelOpen = false"
			/>

			<div
				data-notes-scroll-root
				:class="effectiveHorizontalView ? 'w-full md:overflow-x-auto' : 'w-full'"
			>
				<div class="mt-3 grid w-full gap-4 p-5 md:grid-cols-[320px_minmax(0,1fr)] md:p-8">
					<aside
						v-show="!isMobileViewport || isMobileLandscape || mobileActivePanel !== 'editor'"
						class="rounded-lg border border-default bg-white p-4"
						:class="isMobileLandscape
							? [
								'fixed inset-y-0 left-0 z-50 w-[20rem] overflow-y-auto rounded-none border-y-0 border-l-0 shadow-xl transition-transform duration-200',
								mobileSidePanelOpen ? 'translate-x-0' : '-translate-x-full'
							]
							: ''"
					>
						<div
							v-if="isMobileLandscape"
							class="sticky top-0 z-10 -mx-4 mb-4 border-b border-default bg-white px-4 py-2"
						>
							<div class="flex items-center gap-2">
								<UButton
									:variant="mobileSidePanelTab === 'library' ? 'solid' : 'outline'"
									:color="mobileSidePanelTab === 'library' ? 'primary' : 'neutral'"
									size="sm"
									class="flex-1"
									@click="mobileSidePanelTab = 'library'"
								>
									<span class="inline-flex items-center gap-1">
										<span>Biblioteca</span>
										<UBadge
											size="xs"
											variant="soft"
											color="neutral"
										>{{ songStore.sectionLibrary.length }}</UBadge>
									</span>
								</UButton>
								<UButton
									:variant="mobileSidePanelTab === 'composition' ? 'solid' : 'outline'"
									:color="mobileSidePanelTab === 'composition' ? 'primary' : 'neutral'"
									size="sm"
									class="flex-1"
									@click="mobileSidePanelTab = 'composition'"
								>
									<span class="inline-flex items-center gap-1">
										<span>Compositor</span>
										<UBadge
											size="xs"
											variant="soft"
											color="neutral"
										>{{ songStore.arrangement.length }}</UBadge>
									</span>
								</UButton>
							</div>
						</div>
						<div
							v-show="!isMobileViewport || activeSidebarPanel === 'library'"
							class="mb-4"
						>
							<div class="mb-3 flex items-center justify-between gap-2">
								<h3 class="text-sm font-semibold uppercase tracking-wide text-gray-600">Biblioteca de
									secciones</h3>
								<div class="flex items-center gap-2">
									<UBadge
										color="neutral"
										variant="subtle"
									>{{ songStore.sectionLibrary.length }}</UBadge>
									<UTooltip text="Añadir sección">
										<UButton
											size="xs"
											variant="outline"
											icon="i-lucide-folder-plus"
											aria-label="Añadir sección"
											@click="addSection()"
										/>
									</UTooltip>
								</div>
							</div>

							<div
								ref="sectionLibraryRef"
								class="grid gap-2"
							>
								<div
									v-for="(section, index) in songStore.sectionLibrary"
									:key="section.id"
									class="rounded-md border p-2 transition-colors cursor-pointer"
									:class="selectedSectionId === section.id ? 'border-primary bg-primary-50' : 'border-default bg-white hover:bg-slate-50'"
									@click="selectSectionFromLibrary(section.id)"
								>
									<div class="mb-2 flex items-center gap-2">
										<UTooltip text="Reordenar sección">
											<span
												class="section-library-handle inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-md border border-default text-gray-500"
												aria-label="Reordenar sección"
												@click.stop
											>
												<UIcon
													name="i-lucide-grip-vertical"
													class="h-4 w-4"
												/>
											</span>
										</UTooltip>
										<div class="flex min-w-0 flex-1 items-center justify-between gap-2 text-left">
											<p class="truncate text-sm font-medium">{{ section.name }}</p>
											<UBadge
												color="neutral"
												variant="soft"
												size="xs"
											>{{ getSectionUsageLabel(section.id) }}</UBadge>
										</div>
									</div>
									<div class="flex items-center gap-1">
										<UButton
											size="xs"
											variant="ghost"
											icon="i-lucide-list-plus"
											aria-label="Añadir bloque"
											@click.stop="appendSectionToArrangementFromLibrary(section.id, 1)"
										/>
										<UButton
											size="xs"
											variant="ghost"
											icon="i-lucide-copy"
											aria-label="Duplicar sección"
											@click.stop="duplicateLibrarySection(index)"
										/>
										<UTooltip
											:text="canRemoveSection(section.id) ? 'Borrar sección' : getRemoveBlockedMessage(section.id)"
										>
											<UButton
												size="xs"
												variant="ghost"
												color="error"
												icon="i-lucide-trash-2"
												aria-label="Borrar sección"
												:disabled="!canRemoveSection(section.id)"
												@click.stop="removeLibrarySection(index)"
											/>
										</UTooltip>
									</div>
								</div>
								<p
									v-if="songStore.sectionLibrary.length === 0"
									class="rounded-md border border-dashed border-default p-3 text-sm text-gray-500"
								>
									No hay secciones. Usa el botón de añadir para crear la primera.
								</p>
							</div>
						</div>

						<div
							v-if="!isMobileViewport"
							class="h-px bg-default"
						/>

						<div
							v-show="!isMobileViewport || activeSidebarPanel === 'composition'"
							:class="isMobileViewport ? '' : 'mt-4'"
						>
							<h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">Composición
							</h3>
							<div class="mb-3 grid gap-2">
								<USelectMenu
									v-model="composeSectionId"
									:items="composeSectionOptions"
									value-key="value"
									label-key="label"
									placeholder="Selecciona una sección"
									searchable
									:disabled="songStore.sectionLibrary.length === 0"
								/>
								<div class="flex gap-2">
									<UInput
										v-model.number="composeRepeats"
										type="number"
										min="1"
										class="w-30"
										icon="i-lucide-repeat-2"
										placeholder="Reps"
										aria-label="Repeticiones del bloque"
									/>
									<UButton
										color="primary"
										class="flex-1"
										:disabled="songStore.sectionLibrary.length === 0"
										@click="appendSelectedSectionToArrangement"
									>
										Añadir bloque
									</UButton>
								</div>
								<p
									v-if="songStore.sectionLibrary.length === 0"
									class="text-xs text-gray-500"
								>
									Crea secciones en la biblioteca para poder componer.
								</p>
							</div>
							<div
								ref="compositionRef"
								class="grid gap-2"
							>
								<div
									v-for="(item, index) in songStore.arrangement"
									:key="item.id"
									class="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2"
									:class="item.id === activeArrangementItemId ? 'border-primary bg-primary-50' : item.id === selectedArrangementItemId ? 'border-slate-400 bg-slate-50' : 'border-default bg-white'"
									:data-arrangement-id="item.id"
									@click="selectArrangementItem(item.id)"
								>
									<UTooltip text="Mover bloque">
										<span
											class="arrangement-handle inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-md border border-default text-gray-500"
											aria-label="Mover bloque"
											@click.stop
										>
											<UIcon
												name="i-lucide-grip-vertical"
												class="h-4 w-4"
											/>
										</span>
									</UTooltip>
									<USelectMenu
										:model-value="item.sectionId"
										:items="arrangementSectionOptions"
										value-key="value"
										label-key="label"
										class="min-w-40"
										searchable
										@click.stop
										@update:model-value="setArrangementSection(index, $event)"
									/>
									<UInput
										v-model.number="item.repeats"
										type="number"
										min="1"
										class="w-30"
										icon="i-lucide-repeat-2"
										placeholder="Reps"
										aria-label="Repeticiones del bloque"
										@click.stop
										@update:model-value="normalizeRepeats(index)"
									/>
									<UButton
										icon="i-lucide-copy"
										variant="ghost"
										color="neutral"
										@click.stop="duplicateArrangementItem(index)"
										aria-label="Duplicar bloque"
									/>
									<UButton
										icon="i-lucide-trash-2"
										variant="ghost"
										color="error"
										:disabled="songStore.arrangement.length <= 1"
										@click.stop="removeArrangementItem(index)"
										aria-label="Borrar bloque"
									/>
								</div>
								<p
									v-if="songStore.arrangement.length === 0"
									class="rounded-md border border-dashed border-default p-3 text-sm text-gray-500"
								>
									No hay bloques en la composición.
								</p>
							</div>
						</div>
					</aside>

					<div
						v-show="!isMobileViewport || isMobileLandscape || mobileActivePanel === 'editor'"
						class="md:min-w-0"
					>
						<p
							v-if="!selectedSection"
							class="rounded-lg border border-dashed border-default bg-white p-4 text-sm text-gray-500"
						>
							Selecciona una sección de la biblioteca para empezar a editar.
						</p>
						<SongSection
							v-for="(section, index) in songStore.sectionLibrary"
							:key="section.id"
							v-show="selectedSectionId === section.id"
							:ref="sectionsRefs.set"
							:section="section"
							:horizontal-view="effectiveHorizontalView"
							:sync-notes-scroll="shouldSyncNotesScroll"
							@update:section="updateLibrarySection(index, $event)"
						/>
					</div>
				</div>
			</div>

			<UModal
				v-model:open="showConfirmModal"
				:title="confirmDialogTitle"
				:description="confirmDialogMessage"
			>
				<template #body>
					<div class="grid gap-3">
						<p>{{ confirmDialogMessage }}</p>
						<div class="flex justify-end gap-2">
							<UButton
								color="neutral"
								variant="ghost"
								@click="resolveConfirm(false)"
							>Cancelar</UButton>
							<UButton
								color="primary"
								@click="resolveConfirm(true)"
							>Confirmar</UButton>
						</div>
					</div>
				</template>
			</UModal>
		</div>

		<div class="print-only print-sheet">
			<header class="print-header">
				<h1>{{ songStore.name || 'Partitura' }}</h1>
				<p>BPM {{ songStore.bpm }} · {{ PRINT_BARS_PER_LINE }} compases por línea</p>
			</header>

			<section
				v-for="block in printableArrangement"
				:key="block.key"
				class="print-block"
			>
				<h2>{{ block.title }}</h2>

				<article
					v-for="instrument in block.section.instruments"
					:key="`${block.key}:${instrument.id}`"
					class="print-instrument"
				>
					<h3>{{ instrument.alias }}</h3>
					<div
						v-for="(line, lineIndex) in getPrintableInstrumentLines(instrument.noteLines, block.repeats)"
						:key="`${block.key}:${instrument.id}:line-${lineIndex}`"
						class="print-line"
						:style="{ gridTemplateColumns: `repeat(${line.length}, minmax(0, 1fr))` }"
					>
						<div
							v-for="(group, groupIndex) in line"
							:key="`${block.key}:${instrument.id}:line-${lineIndex}:group-${groupIndex}`"
							class="print-group"
						>
							<span
								v-for="(note, noteIndex) in group"
								:key="`${block.key}:${instrument.id}:line-${lineIndex}:group-${groupIndex}:note-${noteIndex}`"
								class="print-note"
							>
								{{ formatPrintableNote(instrument.type, note) }}
							</span>
						</div>
					</div>
				</article>
			</section>
		</div>

	</div>
</template>

<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useTemplateRefsList } from '@vueuse/core';
import type { SongSection } from '#build/components';
import { dragAndDrop } from '@formkit/drag-and-drop/vue';
import type { Note, Section } from '@/stores/songStore';
import { buildCompositionFromLegacySong, normalizeCompositionData } from '@/utils/composition';
import { createId } from '@/utils/id';

type MobilePanel = 'library' | 'composition' | 'editor'
type MobileSidebarPanel = 'library' | 'composition'

definePageMeta({
	name: "Canvas"
})

let playingAll = ref(false);
let playing = ref(false);
let sectionsRefs = useTemplateRefsList<InstanceType<typeof SongSection>>()
let instrumentsSoundsList = ref<ReturnType<typeof setTimeout>[]>([])
const showConfirmModal = ref(false)
const confirmDialogTitle = ref('Confirmar acción')
const confirmDialogMessage = ref('')
let confirmResolver: ((value: boolean) => void) | null = null
const composeSectionId = ref('')
const composeRepeats = ref(1)
const isMobileViewport = ref(false)
const isLandscapeOrientation = ref(false)
const mobileActivePanel = ref<MobilePanel>('library')
const mobileSidePanelOpen = ref(false)
const mobileSidePanelTab = ref<MobileSidebarPanel>('library')
const selectedSectionId = ref('')
const selectedArrangementItemId = ref('')
const activeArrangementItemId = ref('')
const currentPartitureId = ref<string | undefined>(undefined)
let songStore = useSongStore()

const effectiveHorizontalView = computed(() => {
	if (isMobileViewport.value) {
		return isLandscapeOrientation.value
	}

	return songStore.horizontalView
})

const shouldSyncNotesScroll = computed(() => isMobileViewport.value && effectiveHorizontalView.value)
const isMobileLandscape = computed(() => isMobileViewport.value && isLandscapeOrientation.value)
const activeSidebarPanel = computed<MobileSidebarPanel>(() => {
	if (isMobileLandscape.value) {
		return mobileSidePanelTab.value
	}

	return mobileActivePanel.value === 'composition' ? 'composition' : 'library'
})
const displaySections = computed(() => songStore.resolvedSections)
const compositionRef = ref<HTMLElement | undefined>(undefined)
const sectionLibraryRef = ref<HTMLElement | undefined>(undefined)
const PRINT_BARS_PER_LINE = 4

const printableArrangement = computed(() => {
	const sectionById = new Map(songStore.sectionLibrary.map((section) => [section.id, section]))
	const blocks: { key: string, title: string, section: Section, repeats: number }[] = []

	for (const item of songStore.arrangement) {
		const section = sectionById.get(item.sectionId)
		if (!section) {
			continue
		}

		const repeats = Math.max(1, Math.floor(item.repeats || 1))
		blocks.push({
			key: item.id,
			title: section.name,
			section,
			repeats
		})
	}

	if (blocks.length === 0) {
		for (const section of songStore.sectionLibrary) {
			blocks.push({
				key: section.id,
				title: section.name,
				section,
				repeats: 1
			})
		}
	}

	return blocks
})

const sectionUsageCountById = computed(() => {
	const counter: Record<string, number> = {}

	for (const arrangementItem of songStore.arrangement) {
		counter[arrangementItem.sectionId] = (counter[arrangementItem.sectionId] || 0) + 1
	}

	return counter
})

const composeSectionOptions = computed(() => {
	return songStore.sectionLibrary.map((section) => {
		const usage = sectionUsageCountById.value[section.id] || 0
		const usageLabel = usage === 1 ? '1 bloque' : `${usage} bloques`

		return {
			value: section.id,
			label: `${section.name} · ${usageLabel}`
		}
	})
})

const arrangementSectionOptions = computed(() => {
	return songStore.sectionLibrary.map((section) => ({
		value: section.id,
		label: section.name
	}))
})

const selectedSectionIndex = computed(() => {
	return songStore.sectionLibrary.findIndex((section) => section.id === selectedSectionId.value)
})

const selectedSection = computed(() => {
	if (selectedSectionIndex.value < 0) {
		return null
	}

	return songStore.sectionLibrary[selectedSectionIndex.value] || null
})

const selectedSectionInstrumentsCount = computed(() => {
	return selectedSection.value?.instruments.length || 0
})

const arrangementValues = computed({
	get: () => songStore.arrangement,
	set: (value) => {
		songStore.arrangement = value
		syncLegacySongSnapshot()
	}
})

const sectionLibraryValues = computed({
	get: () => songStore.sectionLibrary,
	set: (value) => {
		songStore.sectionLibrary = value
		syncLegacySongSnapshot()
	}
})

function syncLegacySongSnapshot() {
	songStore.syncLegacySectionsFromComposition()
}

function normalizeRepeats(index: number) {
	const item = songStore.arrangement[index]
	if (!item) {
		return
	}

	item.repeats = Math.max(1, Math.floor(item.repeats || 1))
	syncLegacySongSnapshot()
}

function duplicateArrangementItem(index: number) {
	const source = songStore.arrangement[index]
	if (!source) {
		return
	}

	const duplicatedId = createId()
	songStore.arrangement.splice(index + 1, 0, {
		id: duplicatedId,
		sectionId: source.sectionId,
		repeats: source.repeats
	})
	selectedArrangementItemId.value = duplicatedId
	selectSection(source.sectionId)

	syncLegacySongSnapshot()
}

function removeArrangementItem(index: number) {
	const removing = songStore.arrangement[index]
	if (!removing) {
		return
	}

	if (songStore.arrangement.length <= 1) {
		toast.add({
			title: 'La composición debe tener al menos 1 bloque',
			color: 'warning'
		})
		return
	}

	songStore.arrangement.splice(index, 1)

	if (selectedArrangementItemId.value === removing.id) {
		const fallback = songStore.arrangement[index] || songStore.arrangement[index - 1]
		selectedArrangementItemId.value = fallback?.id || ''
		const fallbackSectionId = fallback?.sectionId || songStore.sectionLibrary[0]?.id || ''
		if (fallbackSectionId) {
			selectSection(fallbackSectionId)
		} else {
			selectedSectionId.value = ''
			composeSectionId.value = ''
		}
	}

	syncLegacySongSnapshot()
}

function removeLibrarySection(index: number) {
	const section = songStore.sectionLibrary[index]
	if (!section) {
		return
	}

	const usage = sectionUsageCountById.value[section.id] || 0
	if (usage > 0) {
		const blocksLabel = usage === 1 ? '1 bloque' : `${usage} bloques`
		toast.add({
			title: `No puedes borrar esta sección: aún tiene ${blocksLabel} en composición`,
			color: 'warning'
		})
		return
	}

	songStore.arrangement = songStore.arrangement.filter((item) => item.sectionId !== section.id)
	songStore.sectionLibrary.splice(index, 1)

	if (selectedSectionId.value === section.id) {
		const nextSectionId = songStore.sectionLibrary[0]?.id || ''
		if (nextSectionId) {
			selectSection(nextSectionId)
		} else {
			selectedSectionId.value = ''
			composeSectionId.value = ''
		}
	}

	const selectedExists = songStore.arrangement.some((item) => item.id === selectedArrangementItemId.value)
	if (!selectedExists) {
		selectedArrangementItemId.value = songStore.arrangement[0]?.id || ''
	}

	if (selectedSectionId.value && !songStore.sectionLibrary.some((item) => item.id === selectedSectionId.value)) {
		initializeSelectionState()
	}

	syncLegacySongSnapshot()
}

function canRemoveSection(sectionId: string) {
	return (sectionUsageCountById.value[sectionId] || 0) === 0
}

function getSectionUsageLabel(sectionId: string) {
	const usage = sectionUsageCountById.value[sectionId] || 0
	return usage === 1 ? '1 bloque' : `${usage} bloques`
}

function getRemoveBlockedMessage(sectionId: string) {
	const usage = sectionUsageCountById.value[sectionId] || 0
	if (usage === 0) {
		return ''
	}

	const blocksLabel = usage === 1 ? '1 bloque' : `${usage} bloques`
	return `No se puede borrar: aún tiene ${blocksLabel} en composición`
}

function updateLibrarySection(index: number, updatedSection: Section) {
	const current = songStore.sectionLibrary[index]
	if (!current) {
		return
	}

	songStore.sectionLibrary.splice(index, 1, {
		...updatedSection,
		id: current.id
	})
	syncLegacySongSnapshot()
}

function duplicateLibrarySection(index: number) {
	const source = songStore.sectionLibrary[index]
	if (!source) {
		return
	}

	const deepCopy: Section = JSON.parse(JSON.stringify(source))
	deepCopy.id = createId()
	deepCopy.name = `${source.name} copia`
	songStore.sectionLibrary.splice(index + 1, 0, deepCopy)
	selectSection(deepCopy.id)
	setMobilePanel('editor')
	syncLegacySongSnapshot()
}

function appendSectionToArrangement(sectionId: string, repeats = 1) {
	const itemId = createId()
	songStore.arrangement.push({
		id: itemId,
		sectionId,
		repeats: Math.max(1, Math.floor(repeats || 1))
	})
	selectedArrangementItemId.value = itemId
	selectSection(sectionId)
	activeArrangementItemId.value = ''
	syncLegacySongSnapshot()
}

function appendSectionToArrangementFromLibrary(sectionId: string, repeats = 1) {
	appendSectionToArrangement(sectionId, repeats)
	if (isMobileLandscape.value) {
		mobileSidePanelTab.value = 'composition'
		mobileSidePanelOpen.value = true
		return
	}

	setMobilePanel('composition')
}

function appendSelectedSectionToArrangement() {
	const sectionId = resolveSectionId(composeSectionId.value) || selectedSectionId.value || songStore.sectionLibrary[0]?.id
	if (!sectionId) {
		return
	}

	appendSectionToArrangement(sectionId, composeRepeats.value)
	setMobilePanel('composition')
}

function selectArrangementItem(itemId: string) {
	selectedArrangementItemId.value = itemId
	const item = songStore.arrangement.find((entry) => entry.id === itemId)
	if (item) {
		selectSection(item.sectionId)
		mobileSidePanelOpen.value = false
		setMobilePanel('editor')
	}
}

function selectSectionFromLibrary(sectionId: string) {
	selectSection(sectionId)
	mobileSidePanelOpen.value = false
	setMobilePanel('editor')
}

function handleArrangementSectionChange(index: number) {
	const arrangementItem = songStore.arrangement[index]
	const sectionId = arrangementItem?.sectionId
	if (!sectionId) {
		return
	}

	selectedArrangementItemId.value = arrangementItem.id
	selectSection(sectionId)
	mobileSidePanelOpen.value = false
	setMobilePanel('editor')
	syncLegacySongSnapshot()
}

function selectSection(sectionId: string) {
	if (!sectionId) {
		return
	}

	selectedSectionId.value = sectionId
	composeSectionId.value = sectionId
}

function setArrangementSection(index: number, sectionIdValue: unknown) {
	const sectionId = resolveSectionId(sectionIdValue)
	const arrangementItem = songStore.arrangement[index]
	if (!arrangementItem || !sectionId) {
		return
	}

	arrangementItem.sectionId = sectionId
	handleArrangementSectionChange(index)
}

function resolveSectionId(value: unknown): string {
	if (typeof value === 'string') {
		return value
	}

	if (value && typeof value === 'object' && 'value' in value) {
		const nestedValue = (value as { value?: unknown }).value
		return typeof nestedValue === 'string' ? nestedValue : ''
	}

	return ''
}

function setMobilePanel(panel: MobilePanel) {
	if (!isMobileViewport.value) {
		return
	}

	if (isMobileLandscape.value) {
		if (panel === 'editor') {
			mobileSidePanelOpen.value = false
			return
		}

		mobileSidePanelOpen.value = true
		mobileSidePanelTab.value = panel === 'library' ? 'library' : 'composition'
		return
	}

	mobileActivePanel.value = panel
}

function toggleMobileSidePanel() {
	if (!isMobileLandscape.value) {
		return
	}

	mobileSidePanelOpen.value = !mobileSidePanelOpen.value
}

function focusActiveArrangementItem(itemId: string) {
	activeArrangementItemId.value = itemId
	if (typeof document === 'undefined') {
		return
	}

	const element = document.querySelector(`[data-arrangement-id="${itemId}"]`) as HTMLElement | null
	element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

function initializeSelectionState() {
	const firstArrangement = songStore.arrangement[0]
	if (firstArrangement) {
		selectedArrangementItemId.value = firstArrangement.id
		selectSection(firstArrangement.sectionId)
		setMobilePanel('editor')
		return
	}

	const firstSection = songStore.sectionLibrary[0]
	selectedArrangementItemId.value = ''
	if (firstSection?.id) {
		selectSection(firstSection.id)
		setMobilePanel('library')
		return
	}

	selectedSectionId.value = ''
	composeSectionId.value = ''
	setMobilePanel('library')
}

function updateResponsiveMode() {
	if (typeof window === 'undefined') {
		return
	}

	const isSmallViewport = window.matchMedia('(max-width: 767px)').matches
	const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches

	isMobileViewport.value = isSmallViewport || isTouchDevice
	isLandscapeOrientation.value = window.matchMedia('(orientation: landscape)').matches

	if (isMobileLandscape.value) {
		mobileActivePanel.value = 'editor'
	}

	if (!isMobileLandscape.value) {
		mobileSidePanelOpen.value = false
	}
}

function splitInChunks<T>(items: T[], size: number): T[][] {
	const chunkSize = Math.max(1, Math.floor(size || 1))
	const chunks: T[][] = []

	for (let index = 0; index < items.length; index += chunkSize) {
		chunks.push(items.slice(index, index + chunkSize))
	}

	return chunks
}

function getPrintableInstrumentLines(noteLines: Note[][][], repeats = 1): Note[][][] {
	const baseGroups = noteLines.flatMap((line) => line.map((group) => [...group]))
	const normalizedRepeats = Math.max(1, Math.floor(Number(repeats) || 1))
	const groups: Note[][] = []

	for (let repeatIndex = 0; repeatIndex < normalizedRepeats; repeatIndex++) {
		for (const group of baseGroups) {
			groups.push([...group])
		}
	}

	return splitInChunks(groups, PRINT_BARS_PER_LINE)
}

function getInstrumentSymbol(instrumentType: number, note: number): string {
	const instrument = songStore.instruments[instrumentType]
	const symbol = instrument?.possibleNotes[note]?.printSymbol

	if (!symbol) {
		return '·'
	}

	return symbol
}

function formatPrintableNote(instrumentType: number, note: Note): string {
	if (Array.isArray(note)) {
		return note.map((value) => getInstrumentSymbol(instrumentType, value)).join('/')
	}

	return getInstrumentSymbol(instrumentType, note)
}

async function printCompositionPdf() {
	await nextTick()

	if (typeof window === 'undefined') {
		return
	}

	const previousTitle = document.title
	const printableTitle = (songStore.name || 'Partitura').trim() || 'Partitura'
	const restoreTitle = () => {
		document.title = previousTitle
	}

	document.title = printableTitle
	window.addEventListener('afterprint', restoreTitle, { once: true })
	window.print()
}

let addSection = (instrumentIndex?: number) => {
	let id = createId();
	let beat = songStore.beats[0]

	if (songStore.sectionLibrary.length !== 0) {
		beat = songStore.sectionLibrary[songStore.sectionLibrary.length - 1].beat;
	}

	let section: Section = {
		id,
		name: `Sección ${songStore.sectionLibrary.length + 1}`,
		instruments: [],
		beat
	};

	if (instrumentIndex !== undefined) {
		let newInstrument = songStore.instruments[instrumentIndex];
		section.instruments.push({
			id: createId(),
			type: instrumentIndex,
			alias: newInstrument.name,
			lines: 1,
			vol: 1,
			noteLines: [generateNewLine(beat.numOfGroups, beat.beatsPerBar)],
		});
	}

	songStore.sectionLibrary.push(section)
	selectSection(section.id)
	setMobilePanel('editor')
	syncLegacySongSnapshot()

}

let clearNotes = async () => {
	const confirmed = await requestConfirmation('Borrar notas', 'Vas a borrar todas las notas, ¿estás seguro?')
	if (confirmed) {

		for (const section of songStore.sectionLibrary) {
			for (const instrument of section.instruments) {

				for (const noteLineIndex in instrument.noteLines) {
					for (const noteIndex in instrument.noteLines[noteLineIndex]) {
						instrument.noteLines[noteLineIndex][noteIndex] = instrument.noteLines[noteLineIndex][noteIndex].map(() => 0);
					}
				}

			}
		}

		syncLegacySongSnapshot()

	}

}


let play = () => {
	playingAll.value = true;
	playing.value = true;
	let accTime = 0;

	for (const arrangementItem of songStore.arrangement) {
		const sectionRef = sectionsRefs.value.find((item) => item.idSection() === arrangementItem.sectionId)
		if (!sectionRef) {
			continue
		}

		const playingLength = sectionRef.getPlayingLength()
		const repeats = Math.max(1, Math.floor(arrangementItem.repeats || 1))

		for (let repeatIndex = 0; repeatIndex < repeats; repeatIndex++) {
			const playTime = accTime
			instrumentsSoundsList.value.push(setTimeout(() => {
				selectSection(arrangementItem.sectionId)
				selectedArrangementItemId.value = arrangementItem.id
				focusActiveArrangementItem(arrangementItem.id)
				sectionRef.play(false)
			}, playTime))
			accTime += playingLength
		}
	}

	if (!songStore.repeat) {
		instrumentsSoundsList.value.push(setTimeout(() => {
			instrumentsSoundsList.value = []
			playingAll.value = false
			playing.value = false
			activeArrangementItemId.value = ''
		}, accTime))
	} else {
		instrumentsSoundsList.value.push(setTimeout(() => {
			play()
		}, accTime))
	}
}
let pause = (fullPause = true) => {
	playingAll.value = false;
	playing.value = false;

	if (fullPause) {
		instrumentsSoundsList.value.forEach(instrument => clearTimeout(instrument));

		instrumentsSoundsList.value = [];
		activeArrangementItemId.value = ''

		for (let index = 0; index < sectionsRefs.value.length; index++) {
			sectionsRefs.value[index].pause();
		}
	}
}

let insert = () => {

	saveSong(false);

	let text = `<iframe src="${window.location.href}" height="300" width="900"></iframe>`;

	navigator.clipboard.writeText(text)
	toast.add({ title: 'Codigo para insertar copiado', color: 'primary' })


}

let route = useRoute()
const toast = useToast()

function isForbiddenError(error: unknown): boolean {
	const code = (error as any)?.cause?.data?.errors?.[0]?.extensions?.code
	const status = (error as any)?.statusCode || (error as any)?.cause?.statusCode
	const message = String((error as any)?.message || '')

	return code === 'FORBIDDEN' || status === 403 || message.includes('FORBIDDEN')
}

let saveSong = async (notify = true, forceAskClone = false) => {
	const hasCurrentPartiture = typeof currentPartitureId.value === 'string'
	let shouldCreateCopy = !hasCurrentPartiture

	if (!shouldCreateCopy && (songStore.user === undefined || forceAskClone)) {
		const confirmed = await requestConfirmation('Crear copia', 'Vas a crear una nueva copia de la canción, ¿estás seguro?')
		if (!confirmed) {
			return
		}
		shouldCreateCopy = true
	}

	if (!shouldCreateCopy && typeof currentPartitureId.value === 'string') {
		try {
			await updatePartiture(currentPartitureId.value)
		} catch (error) {
			if (isForbiddenError(error)) {
				return await saveSong(notify, true)
			}

			return await saveSong(notify, true)
		}
	} else {
		let createdPartiture = await createPartiture()

		if (createdPartiture) {
			currentPartitureId.value = createdPartiture

			await navigateTo({
				name: 'Partiture',
				params: {
					id: createdPartiture
				}
			})
		}
	}

	navigator.clipboard.writeText(window.location.href)

	if (notify) {
		toast.add({ title: 'Enlace copiado al portapapeles', color: 'primary' })
	}
}

function requestConfirmation(title: string, message: string): Promise<boolean> {
	confirmDialogTitle.value = title
	confirmDialogMessage.value = message
	showConfirmModal.value = true

	return new Promise((resolve) => {
		confirmResolver = resolve
	})
}

function resolveConfirm(value: boolean) {
	showConfirmModal.value = false
	if (confirmResolver) {
		confirmResolver(value)
		confirmResolver = null
	}
}

onMounted(async () => {
	updateResponsiveMode()
	window.addEventListener('resize', updateResponsiveMode)
	window.addEventListener('orientationchange', updateResponsiveMode)

	if (songStore.sectionLibrary.length === 0 && songStore.sections.length > 0) {
		songStore.initializeCompositionFromLegacy()
		syncLegacySongSnapshot()
	}

	let possibleShare = route.query.share
	if (route.query.share === undefined && window.location.hash.includes("share")) {
		possibleShare = (new URL(window.location.href.replace("#/", "")).searchParams.get("share"))
	}

	if (typeof route.params.id === "string" && route.params.id) {
		try {
			atob(route.params.id)
			possibleShare = route.params.id
		} catch {
		}
	}

	if (typeof possibleShare === 'string') {
		let oldFormat = JSON.parse(atob(possibleShare))

		let version = typeof oldFormat.version === 'number' ? oldFormat.version : (oldFormat.beat ? 1 : 2)
		let newFormat = migratePartiture({ version, ...oldFormat })
		const normalizedComposition = normalizeCompositionData(newFormat.sectionLibrary, newFormat.arrangement)

		if (normalizedComposition) {
			songStore.applyComposition(normalizedComposition.sectionLibrary, normalizedComposition.arrangement)
		} else {
			const fallbackComposition = buildCompositionFromLegacySong(newFormat.song)
			songStore.applyComposition(fallbackComposition.sectionLibrary, fallbackComposition.arrangement)
		}
		currentPartitureId.value = undefined
		songStore.bpm = newFormat.bpm
		songStore.name = newFormat.name


	} else if (typeof route.query.id === 'string' || typeof route.params.id === "string" && route.params.id) {
		let partiture = ""

		if (typeof route.query.id === 'string') {
			partiture = route.query.id
		} else if (typeof route.params.id === "string") {
			partiture = route.params.id
		}

		await loadPartiture(partiture)
		currentPartitureId.value = partiture

	} else if (songStore.sectionLibrary.length === 0) {

		addSection(1);
		if (songStore.sectionLibrary[0]?.id) {
			appendSectionToArrangement(songStore.sectionLibrary[0].id, 1)
		}
		currentPartitureId.value = undefined
	} else {
		currentPartitureId.value = undefined
		syncLegacySongSnapshot()
	}

	initializeSelectionState()

	dragAndDrop({
		parent: compositionRef,
		values: arrangementValues,
		dragHandle: '.arrangement-handle',
	})

	dragAndDrop({
		parent: sectionLibraryRef,
		values: sectionLibraryValues,
		dragHandle: '.section-library-handle',
	})


})

onBeforeUnmount(() => {
	if (typeof window === 'undefined') {
		return
	}

	window.removeEventListener('resize', updateResponsiveMode)
	window.removeEventListener('orientationchange', updateResponsiveMode)
})



</script>

<style>
.print-only {
	display: none;
}

.print-sheet {
	padding: 0;
	color: #111;
	font-family: 'Times New Roman', Times, serif;
	max-width: 100%;
}

.print-header {
	margin-bottom: 14px;
	padding: 0 0 10px;
	border-bottom: 3px double #111;
}

.print-header h1 {
	margin: 0;
	font-size: 24px;
	font-weight: 700;
}

.print-header p {
	margin: 6px 0 0;
	font-size: 13px;
}

.print-block {
	margin-top: 16px;
	break-inside: avoid;
	padding-top: 6px;
	border-top: 1px solid #d8d8d8;
}

.print-block h2 {
	margin: 0 0 10px;
	font-size: 16px;
	font-weight: 700;
}

.print-instrument {
	margin-bottom: 12px;
	break-inside: avoid;
}

.print-instrument h3 {
	margin: 0 0 5px;
	font-size: 14px;
	font-weight: 700;
}

.print-line {
	display: grid;
	gap: 8px;
	margin-bottom: 8px;
}

.print-group {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(16px, 1fr));
	gap: 0;
	padding: 0;
	border: 1px solid #111;
	min-height: 30px;
	background: #fff;
}

.print-note {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-size: 12px;
	font-weight: 700;
	line-height: 1;
	padding: 4px 2px;
	border-right: 1px solid #d2d2d2;
}

.print-note:last-child {
	border-right: 0;
}

@media print {
	@page {
		size: A4 portrait;
		margin: 10mm;
	}

	body {
		background: #fff;
	}

	main {
		padding: 0 !important;
	}

	.screen-only {
		display: none !important;
	}

	.print-only {
		display: block !important;
	}

	.print-sheet {
		padding: 8mm;
		box-sizing: border-box;
	}
}
</style>
