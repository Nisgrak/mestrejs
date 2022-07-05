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
				/>

				<q-btn
					:text-color="songStore.repeat ? 'secondary' : 'grey'"
					class="w-50px"
					:icon="mdiRepeat"
					outline
					@click="songStore.repeat = !songStore.repeat"
				/>

				<q-btn
					:text-color="songStore.showNote ? 'secondary' : 'grey'"
					unelevated
					outline
					class="w-50px"
					:icon="mdiNumeric"
					@click="songStore.showNote = !songStore.showNote"
				/>
				<q-btn
					:text-color="songStore.horizontalView ? 'secondary' : 'grey'"
					unelevated
					outline
					class="w-50px"
					:icon="mdiViewDashboard"
					@click="songStore.horizontalView = !songStore.horizontalView"
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
					/>
					<q-btn
						:icon="mdiContentSave"
						flat
						@click="saveSong(true)"
					/>
					<q-btn
						:icon="mdiDeleteEmpty"
						flat
						@click="clearNotes()"
					/>
					<q-btn
						:icon="mdiXml"
						flat
						@click="insert()"
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
import { Section, useSongStore } from 'src/stores/songStore';
import SongSection from 'src/components/SongSection.vue';
import { useRoute, useRouter } from 'vue-router';
import { onMounted, ref, toRaw } from 'vue';
import { createPartiture, loadPartiture, updatePartiture } from 'src/utils/partiture';
import { mdiContentSave, mdiPlay, mdiStop, mdiRepeat, mdiXml, mdiCardPlus, mdiDeleteEmpty, mdiNumeric, mdiViewDashboard } from '@quasar/extras/mdi-v6';
import { useTemplateRefsList } from '@vueuse/core';

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
			notes: (new Array(beat.numOfGroups * beat.beatsPerBar)).fill(0)
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

				instrument.notes = Array.from(Array(instrument.notes.length), () => 0);

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
let router = useRouter()

let $q = useQuasar()

let saveSong = async (notify = true) => {
	if (typeof route.query.id === 'string') {

		await updatePartiture(route.query.id)

	} else {
		let createdPartiture = await createPartiture()

		if (createdPartiture) {

			router.push({
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
	if (typeof route.query.id === 'string') {
		loadPartiture(route.query.id)

	} else if (typeof route.query.share === 'string') {


		let oldFormat = JSON.parse(atob( route.query.share))
		songStore.bpm = oldFormat.bmp
		songStore.sections = oldFormat.sections


	}else if (songStore.sections.length === 0) {

		addSection(1);
	}

})

</script>

<style>
</style>
