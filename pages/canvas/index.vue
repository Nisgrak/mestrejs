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
							:disabled="songStore.sections.length == 0"
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
			<div
				class="mt-3 flex w-full flex-col justify-start gap-4 p-5 md:p-15"
				:class="{
					'md:min-w-max md:pl-0': effectiveHorizontalView
				}"
				ref="parentRef"
			>
				<SongSection
					v-for="(section, index) in songStore.sections"
					:key="section.id"
					:ref="sectionsRefs.set"
					v-model:section="songStore.sections[index]"
					:horizontal-view="effectiveHorizontalView"
					:sync-notes-scroll="shouldSyncNotesScroll"
					@remove="songStore.sections.splice(index, 1)"
					@duplicate="duplicateSection(index)"
				/>
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
import { computed, onBeforeUnmount, onMounted, ref, toRaw } from 'vue';
import { useTemplateRefsList } from '@vueuse/core';
import type { SongSection } from '#build/components';
import { dragAndDrop } from '@formkit/drag-and-drop/vue';
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
const isMobileViewport = ref(false)
const isLandscapeOrientation = ref(false)

const effectiveHorizontalView = computed(() => {
	if (isMobileViewport.value) {
		return isLandscapeOrientation.value
	}

	return songStore.horizontalView
})

const shouldSyncNotesScroll = computed(() => isMobileViewport.value && effectiveHorizontalView.value)
const isMobileLandscape = computed(() => isMobileViewport.value && isLandscapeOrientation.value)

function updateResponsiveMode() {
	if (typeof window === 'undefined') {
		return
	}

	const isSmallViewport = window.matchMedia('(max-width: 767px)').matches
	const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches

	isMobileViewport.value = isSmallViewport || isTouchDevice
	isLandscapeOrientation.value = window.matchMedia('(orientation: landscape)').matches
}

let duplicateSection = (index: number) => {
	let deepCopy = JSON.parse(JSON.stringify(toRaw(songStore.sections[index])))
	deepCopy.id = createId()
	songStore.sections.splice(index, 0, deepCopy)
}

let addSection = (instrumentIndex?: number) => {
	let id = createId();
	let beat = songStore.beats[0]

	if (songStore.sections.length != 0) {
		beat = songStore.sections[songStore.sections.length - 1].beat;
	}

	let section: Section = {
		id,
		name: `Sección ${songStore.sections.length + 1}`,
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

	songStore.sections.push(section);

}

let clearNotes = async () => {
	const confirmed = await requestConfirmation('Borrar notas', 'Vas a borrar todas las notas, ¿estás seguro?')
	if (confirmed) {

		for (const section of songStore.sections) {
			for (const instrument of section.instruments) {

				for (const noteLineIndex in instrument.noteLines) {
					for (const noteIndex in instrument.noteLines[noteLineIndex]) {
						instrument.noteLines[noteLineIndex][noteIndex] = instrument.noteLines[noteLineIndex][noteIndex].map(() => 0);
					}
				}

			}
		}

	}

}


let play = () => {
	playingAll.value = true;
	playing.value = true;
	let accTime = 0;
	for (let index = 0; index < songStore.sections.length; index++) {
		let section = sectionsRefs.value.find(section => section.idSection() === songStore.sections[index].id);
		if (section === undefined) {
			return
		}

		let playingLength = section.getPlayingLength();
		accTime += playingLength;

		let playTime = sectionsRefs.value.slice(0, index).reduce((acc, section) => acc + section.getPlayingLength(), 0);

		instrumentsSoundsList.value.push(setTimeout(() => {
			if (section === undefined) {
				return
			}
			section.play(false);
		}, playTime));

		if (index + 1 == sectionsRefs.value.length) {
			if (!songStore.repeat) {
				instrumentsSoundsList.value.push(
					setTimeout(() => {
						instrumentsSoundsList.value = [];
						playingAll.value = false;
						playing.value = false;

					}, accTime));
			} else {
				instrumentsSoundsList.value.push(
					setTimeout(() => {
						play();
					}, accTime)
				);
			}
		}
	}
}
let pause = (fullPause = true) => {
	playingAll.value = false;
	playing.value = false;

	if (fullPause) {
		instrumentsSoundsList.value.forEach(instrument => clearTimeout(instrument));

		instrumentsSoundsList.value = [];

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

let songStore = useSongStore()

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

let parentRef = ref<HTMLElement | undefined>(undefined)


onMounted(async () => {
	updateResponsiveMode()
	window.addEventListener('resize', updateResponsiveMode)
	window.addEventListener('orientationchange', updateResponsiveMode)

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

		let version = oldFormat.beat ? 1 : 2
		let newFormat = migratePartiture({ version, ...oldFormat })
		songStore.sections = newFormat.song
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

	} else if (songStore.sections.length === 0) {

		addSection(1);
	}


	let sections = computed({
		get: () => songStore.sections,
		set: (value) => songStore.sections = value
	})


	// dragAndDrop({
	// 	parent: parentRef,
	// 	values: sections,
	// 	dragHandle: ".song-section-handle",
	// })


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
