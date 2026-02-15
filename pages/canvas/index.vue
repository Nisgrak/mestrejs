<template>
	<div class="overflow-x-clip">
		<div class="sticky top-0 z-40 border-b border-default bg-white shadow-sm">
			<div
				class="flex w-full items-center bg-white px-2 py-2 md:justify-center md:gap-3 md:px-5"
				:class="isMobileLandscape ? 'flex-nowrap gap-1 overflow-x-auto' : 'flex-wrap gap-2'"
			>
				<div
					class="flex items-center md:w-auto md:flex-nowrap"
					:class="isMobileLandscape ? 'w-auto shrink-0 flex-nowrap gap-1' : 'w-full flex-wrap gap-2'"
				>
					<UTooltip :text="playing ? 'Pausar reproduccion' : 'Reproducir cancion'">
						<UButton
							color="primary"
							size="md"
							class="h-9"
							:disabled="displaySections.length === 0"
							:icon="playing ? 'i-lucide-square' : 'i-lucide-play'"
							@click="playing ? pause() : play()"
							:aria-label="playing ? 'Pausar reproduccion' : 'Reproducir cancion'"
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
						<UTooltip text="Anadir seccion">
							<UButton
								size="md"
								class="h-9"
								icon="i-lucide-folder-plus"
								variant="ghost"
								@click="addSection()"
								aria-label="Anadir seccion"
							/>
						</UTooltip>
						<UTooltip text="Componer seccion existente">
							<UButton
								size="md"
								class="h-9"
								icon="i-lucide-list-plus"
								variant="ghost"
								@click="appendSelectedSectionToArrangement"
								:disabled="songStore.sectionLibrary.length === 0"
								aria-label="Componer seccion existente"
							/>
						</UTooltip>
						<UTooltip text="Guardar cancion">
							<UButton
								size="md"
								class="h-9"
								icon="i-lucide-save"
								variant="ghost"
								@click="saveSong(true)"
								aria-label="Guardar cancion"
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
						<UTooltip text="Insertar cancion">
							<UButton
								size="md"
								class="h-9"
								icon="i-lucide-code"
								variant="ghost"
								@click="insert()"
								aria-label="Insertar cancion"
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
		</div>

		<div
			data-notes-scroll-root
			:class="effectiveHorizontalView ? 'w-full md:overflow-x-auto' : 'w-full'"
		>
			<div class="mt-3 grid w-full gap-4 p-5 md:grid-cols-[320px_minmax(0,1fr)] md:p-8">
				<aside class="rounded-lg border border-default bg-white p-4">
					<h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">Composicion</h3>
					<div class="mb-3 grid gap-2">
						<select
							v-model="composeSectionId"
							class="rounded-md border border-default bg-white px-3 py-2 text-sm"
						>
							<option v-for="section in songStore.sectionLibrary" :key="section.id" :value="section.id">
								{{ section.name }}
							</option>
						</select>
						<div class="flex gap-2">
							<UInput v-model.number="composeRepeats" type="number" min="1" class="w-24" />
							<UButton color="primary" class="flex-1" @click="appendSelectedSectionToArrangement">Anadir bloque</UButton>
						</div>
					</div>
					<div ref="compositionRef" class="grid gap-2">
						<div
							v-for="(item, index) in songStore.arrangement"
							:key="item.id"
							class="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2"
							:class="item.id === activeArrangementItemId ? 'border-primary bg-primary-50' : item.id === selectedArrangementItemId ? 'border-slate-400 bg-slate-50' : 'border-default bg-white'"
							:data-arrangement-id="item.id"
							@click="selectArrangementItem(item.id)"
						>
							<UButton
								class="arrangement-handle cursor-grab"
								icon="i-lucide-grip-vertical"
								variant="ghost"
								color="neutral"
								aria-label="Mover bloque"
							/>
							<select
								v-model="item.sectionId"
								class="min-w-40 rounded-md border border-default bg-white px-3 py-2 text-sm"
								@click.stop
								@change="handleArrangementSectionChange(index)"
							>
								<option v-for="section in songStore.sectionLibrary" :key="section.id" :value="section.id">
									{{ section.name }}
								</option>
							</select>
							<UInput
								v-model.number="item.repeats"
								type="number"
								min="1"
								class="w-22"
								@click.stop
								@update:model-value="normalizeRepeats(index)"
							/>
							<UButton icon="i-lucide-copy" variant="ghost" color="neutral" @click.stop="duplicateArrangementItem(index)" aria-label="Duplicar bloque" />
							<UButton icon="i-lucide-trash-2" variant="ghost" color="error" @click.stop="removeArrangementItem(index)" aria-label="Borrar bloque" />
						</div>
					</div>
				</aside>

				<div class="rounded-lg border border-default bg-white p-4">
					<h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">Editor integrado</h3>
					<SongSection
						v-for="(section, index) in songStore.sectionLibrary"
						:key="section.id"
						v-show="selectedSectionId === section.id"
						:ref="sectionsRefs.set"
						:section="section"
						:horizontal-view="effectiveHorizontalView"
						:sync-notes-scroll="shouldSyncNotesScroll"
						@update:section="updateLibrarySection(index, $event)"
						@remove="removeLibrarySection(index)"
						@duplicate="duplicateLibrarySection(index)"
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
</template>

<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useTemplateRefsList } from '@vueuse/core';
import type { SongSection } from '#build/components';
import { dragAndDrop } from '@formkit/drag-and-drop/vue';
import type { Section } from '@/stores/songStore';
import { buildArrangementFromLibrary, hasValidCompositionData } from '@/utils/composition';
import { createId } from '@/utils/id';

definePageMeta({
	name: "Canvas"
})

let playingAll = ref(false);
let playing = ref(false);
let sectionsRefs = useTemplateRefsList<InstanceType<typeof SongSection>>()
let instrumentsSoundsList = ref<ReturnType<typeof setTimeout>[]>([])
const showConfirmModal = ref(false)
const confirmDialogTitle = ref('Confirmar accion')
const confirmDialogMessage = ref('')
let confirmResolver: ((value: boolean) => void) | null = null
const composeSectionId = ref('')
const composeRepeats = ref(1)
const isMobileViewport = ref(false)
const isLandscapeOrientation = ref(false)
const selectedSectionId = ref('')
const selectedArrangementItemId = ref('')
const activeArrangementItemId = ref('')
let songStore = useSongStore()

const effectiveHorizontalView = computed(() => {
	if (isMobileViewport.value) {
		return isLandscapeOrientation.value
	}

	return songStore.horizontalView
})

const shouldSyncNotesScroll = computed(() => isMobileViewport.value && effectiveHorizontalView.value)
const isMobileLandscape = computed(() => isMobileViewport.value && isLandscapeOrientation.value)
const displaySections = computed(() => songStore.resolvedSections)
const compositionRef = ref<HTMLElement | undefined>(undefined)

const arrangementValues = computed({
	get: () => songStore.arrangement,
	set: (value) => {
		songStore.arrangement = value
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
	selectedSectionId.value = source.sectionId

	syncLegacySongSnapshot()
}

function removeArrangementItem(index: number) {
	const removing = songStore.arrangement[index]
	if (!removing) {
		return
	}

	songStore.arrangement.splice(index, 1)

	if (selectedArrangementItemId.value === removing.id) {
		const fallback = songStore.arrangement[index] || songStore.arrangement[index - 1]
		selectedArrangementItemId.value = fallback?.id || ''
		selectedSectionId.value = fallback?.sectionId || songStore.sectionLibrary[0]?.id || ''
	}

	syncLegacySongSnapshot()
}

function removeLibrarySection(index: number) {
	const section = songStore.sectionLibrary[index]
	if (!section) {
		return
	}

	songStore.arrangement = songStore.arrangement.filter((item) => item.sectionId !== section.id)
	songStore.sectionLibrary.splice(index, 1)

	if (selectedSectionId.value === section.id) {
		selectedSectionId.value = songStore.sectionLibrary[0]?.id || ''
	}

	const selectedExists = songStore.arrangement.some((item) => item.id === selectedArrangementItemId.value)
	if (!selectedExists) {
		selectedArrangementItemId.value = songStore.arrangement[0]?.id || ''
	}

	if (!songStore.arrangement.some((item) => item.sectionId === selectedSectionId.value)) {
		initializeSelectionState()
	}

	syncLegacySongSnapshot()
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
	selectedSectionId.value = deepCopy.id
	appendSectionToArrangement(deepCopy.id, 1)
}

function appendSectionToArrangement(sectionId: string, repeats = 1) {
	const itemId = createId()
	songStore.arrangement.push({
		id: itemId,
		sectionId,
		repeats: Math.max(1, Math.floor(repeats || 1))
	})
	selectedArrangementItemId.value = itemId
	selectedSectionId.value = sectionId
	activeArrangementItemId.value = ''
	syncLegacySongSnapshot()
}

function appendSelectedSectionToArrangement() {
	const sectionId = composeSectionId.value || selectedSectionId.value || songStore.sectionLibrary[0]?.id
	if (!sectionId) {
		return
	}

	appendSectionToArrangement(sectionId, composeRepeats.value)
}

function selectArrangementItem(itemId: string) {
	selectedArrangementItemId.value = itemId
	const item = songStore.arrangement.find((entry) => entry.id === itemId)
	if (item) {
		selectedSectionId.value = item.sectionId
		composeSectionId.value = item.sectionId
	}
}

function handleArrangementSectionChange(index: number) {
	const arrangementItem = songStore.arrangement[index]
	const sectionId = arrangementItem?.sectionId
	if (!sectionId) {
		return
	}

	selectedArrangementItemId.value = arrangementItem.id
	selectedSectionId.value = sectionId
	composeSectionId.value = sectionId
	syncLegacySongSnapshot()
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
		selectedSectionId.value = firstArrangement.sectionId
		composeSectionId.value = firstArrangement.sectionId
		return
	}

	const firstSection = songStore.sectionLibrary[0]
	selectedArrangementItemId.value = ''
	selectedSectionId.value = firstSection?.id || ''
	composeSectionId.value = firstSection?.id || ''
}

function updateResponsiveMode() {
	if (typeof window === 'undefined') {
		return
	}

	const isSmallViewport = window.matchMedia('(max-width: 767px)').matches
	const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches

	isMobileViewport.value = isSmallViewport || isTouchDevice
	isLandscapeOrientation.value = window.matchMedia('(orientation: landscape)').matches
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
	composeSectionId.value = section.id
	appendSectionToArrangement(section.id, 1)

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
				selectedSectionId.value = arrangementItem.sectionId
				selectedArrangementItemId.value = arrangementItem.id
				composeSectionId.value = arrangementItem.sectionId
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

let saveSong = async (notify = true, forceAskClone = false) => {

	let forceCreate: boolean | undefined
	if (songStore.user === undefined || forceAskClone) {
		forceCreate = await requestConfirmation('Crear copia', 'Vas a crear una nueva copia de la cancion, ¿estás seguro?')
		if (!forceCreate) {
			forceCreate = undefined
		}
	} else {
		forceCreate = false
	}

	if (forceCreate === undefined) {
		return
	}


	if (!forceCreate && (typeof route.query.id === 'string' || typeof route.params.id === "string")) {
		let partiture = ""

		if (typeof route.query.id === 'string') {
			partiture = route.query.id
		} else if (typeof route.params.id === "string") {
			partiture = route.params.id
		}

		try {

			await updatePartiture(partiture)
		} catch (error) {

			if ((error as any)?.cause?.data?.errors?.[0]?.extensions?.code === "FORBIDDEN") {
				return await saveSong(notify, true)
			}
		}


	} else {
		let createdPartiture = await createPartiture()

		if (createdPartiture) {

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

	if (typeof route.params.id === "string") {
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

		if (hasValidCompositionData(newFormat.sectionLibrary, newFormat.arrangement)) {
			songStore.applyComposition(newFormat.sectionLibrary, newFormat.arrangement)
		} else {
			const library = newFormat.song
			songStore.applyComposition(library, buildArrangementFromLibrary(library))
		}
		songStore.bpm = newFormat.bpm
		songStore.name = newFormat.name


	} else if (typeof route.query.id === 'string' || typeof route.params.id === "string") {
		let partiture = ""

		if (typeof route.query.id === 'string') {
			partiture = route.query.id
		} else if (typeof route.params.id === "string") {
			partiture = route.params.id
		}

		await loadPartiture(partiture)

	} else if (songStore.sectionLibrary.length === 0) {

		addSection(1);
	} else {
		syncLegacySongSnapshot()
	}

	initializeSelectionState()

	dragAndDrop({
		parent: compositionRef,
		values: arrangementValues,
		dragHandle: '.arrangement-handle',
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

<style></style>
