<template>
	<div>
		<q-page-sticky
			position="top"
			expand
			class="z-5 bg-white"
		>
			<div class="border-1 flex flex-row items-center md:justify-center overflow-auto flex-nowrap gap-3 px-5 py-2 sticky left-0 top-0 w-full bg-white h-full z-5">
				<q-btn
					color="secondary"
					:disabled="songStore.sections.length == 0"
					:icon="playing ? mdiStop : mdiPlay"
					class="w-50px"
					unelevated
					@click="playing ? pause() : play()"
					:aria-label="playing ? 'Pausar reproducción' : 'Reproducir canción'"
				/>

				<q-btn
					:text-color="songStore.repeat ? 'secondary' : 'grey'"
					class="w-50px"
					:icon="mdiRepeat"
					outline
					@click="songStore.repeat = !songStore.repeat"
					:aria-label="songStore.repeat ? 'Desactivar repetición' : 'Activar repetición'"
				/>

				<q-btn
					:text-color="songStore.showNote ? 'secondary' : 'grey'"
					unelevated
					outline
					class="w-50px"
					:icon="mdiNumeric"
					@click="songStore.showNote = !songStore.showNote"
					:aria-label="songStore.showNote ? 'Ocultar notas' : 'Mostrar notas'"
				/>
				<q-btn
					:text-color="songStore.horizontalView ? 'secondary' : 'grey'"
					unelevated
					outline
					class="w-50px"
					:icon="mdiViewDashboard"
					@click="songStore.horizontalView = !songStore.horizontalView"
					:aria-label="songStore.horizontalView ? 'Vista vertical' : 'Vista horizontal'"
				/>

				<q-btn-group
					flat
					rounded
					unelevated
				>
					<q-btn
						:icon="mdiCardPlus"
						flat
						@click="addSection()"
						aria-label="Añadir sección"
					/>
					<q-btn
						:icon="mdiContentSave"
						flat
						@click="saveSong(true)"
						aria-label="Guardar canción"
					/>
					<q-btn
						:icon="mdiDeleteEmpty"
						flat
						@click="clearNotes()"
						aria-label="Borrar notas"
					/>
					<q-btn
						:icon="mdiXml"
						flat
						@click="insert()"
						aria-label="Insertar canción"
					/>
				</q-btn-group>



				<q-input
					v-model="songStore.name"
					label="Nombre"
				/>
				<q-input
					v-model="songStore.bpm"
					label="BPM"
					type="number"
				/>
			</div>
		</q-page-sticky>

		<div
			class="w-full p-5 mt-15 md:p-15 flex flex-col justify-start"
			:class="{
				'min-w-max !pl-0': songStore.horizontalView
			}"
		>
			<SongSection
				v-for="(section, index) in songStore.sections"
				:key="section.id"
				:ref="sectionsRefs.set"
				v-model:section="songStore.sections[index]"
				@remove="songStore.sections.splice(index, 1)"
				@duplicate="duplicateSection(index)"
			/>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { copyToClipboard, uid, useQuasar, extend  } from 'quasar';
import { Section } from '../stores/songStore';
import SongSection from '../components/SongSection.vue';
import { useRoute } from 'vue-router';
import { onMounted, ref, toRaw } from 'vue';
import { createPartiture, loadPartiture, updatePartiture } from '../utils/partiture';
import { mdiContentSave, mdiPlay, mdiStop, mdiRepeat, mdiXml, mdiCardPlus, mdiDeleteEmpty, mdiNumeric, mdiViewDashboard } from '@quasar/extras/mdi-v6';
import { useTemplateRefsList } from '@vueuse/core';

definePageMeta({
  name: "Canvas"
})

let playingAll = ref(false);
let playing = ref(false);
let sectionsRefs = useTemplateRefsList<InstanceType<typeof SongSection>>()
let instrumentsSoundsList =ref<ReturnType<typeof setTimeout>[]>([])

let duplicateSection = (index: number) => {
	let deepCopy = JSON.parse(JSON.stringify(toRaw(songStore.sections[index])))
	deepCopy.id = uid()
	songStore.sections.splice(index, 0, deepCopy)
}

let addSection = (instrumentIndex?: number) => {
	let id = uid();
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
			id: uid(),
			type: instrumentIndex,
			alias: newInstrument.name,
			lines: 1,
			vol: 1,
			noteLines: [generateNewLine(beat.numOfGroups, beat.beatsPerBar)],
		});
	}

	songStore.sections.push(section);

}

let clearNotes = () => {
	 $q.dialog({
		title: 'Borrar notas',
		message: 'Vas a borrar todas las notas, ¿estás seguro?',
		cancel: true,
		persistent: true
	}).onOk(() => {

		for (const section of songStore.sections) {
			for (const instrument of section.instruments) {

				for (const noteLineIndex in instrument.noteLines) {
					for (const noteIndex in instrument.noteLines[noteLineIndex]) {
						instrument.noteLines[noteLineIndex][noteIndex] = instrument.noteLines[noteLineIndex][noteIndex].map(() => 0);
					}
				}

			}
		}

	}).onCancel(() => {
		// console.log('>>>> Cancel')
	}).onDismiss(() => {
		// console.log('I am triggered on both OK and Cancel')
	})

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

	copyToClipboard(text);

	$q.notify({
		message: 'Código para insertar copiado',
		color: 'positive',
		position: 'top-right',
		timeout: 2000
	})


}

let songStore = useSongStore()

let route = useRoute()

let $q = useQuasar()

let saveSong = async (notify = true) => {
	if (typeof route.query.id === 'string') {

		await updatePartiture(route.query.id)

	} else {
		let createdPartiture = await createPartiture()

		if (createdPartiture) {

			await navigateTo({
				name: 'Canvas',
				query: {
					id: createdPartiture
				}
			})
		}
	}

	copyToClipboard(window.location.href)

	if (notify) {

		$q.notify({
			message: 'Enlace copiado al portapapeles',
			color: 'positive',
			position: 'top-right',
			timeout: 2000
		})
	}
}

onMounted(async () => {
	let possibleShare = route.query.share
	if (route.query.share === undefined && window.location.hash.includes("share")) {
		possibleShare = (new URL(window.location.href.replace("#/", "")).searchParams.get("share"))
	}

	if (typeof route.query.id === 'string') {
		loadPartiture(route.query.id)

	} else if (typeof possibleShare === 'string') {
		let oldFormat = JSON.parse(atob( possibleShare))

		let version = oldFormat.beat ? 1 : 2
		let newFormat = migratePartiture({version, ...oldFormat})
		 songStore.sections = newFormat.song
		 songStore.bpm = newFormat.bpm
		 songStore.name = newFormat.name


	} else if (songStore.sections.length === 0) {

		addSection(1);
	}

	// let test = migratePartiture()
	// songStore.sections = test.song
	// songStore.bpm = test.bpm
	// console.log(songStore.sections);


})

</script>

<style>
</style>
