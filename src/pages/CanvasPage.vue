<template>
	<div>
		<div class="border-1 flex flex-row items-center gap-3 px-5">
			<q-btn
				color="secondary"
				:disabled="songStore.sections.length == 0"
				:icon="playing ? mdiStop : mdiPlay"
				class="w-50px"
				@click="playing ? pause() : play()"
			/>

			<q-btn
				:color="songStore.repeat ? 'secondary' : 'white'"
				:text-color="songStore.repeat ? 'white' : 'black'"
				class="w-50px"
				:icon="mdiRepeat"
				@click="songStore.repeat = !songStore.repeat"
			/>

			<q-btn
				:icon="mdiPlus"
				flat
				round
				@click="addSection()"
			/>
			<q-btn
				:icon="mdiContentSave"
				flat
				round
				@click="saveSong"
			/>

			<q-input
				v-model="songStore.bpm"
				label="BPM"
				type="number"
			/>
		</div>
		<div class="w-full p-15 flex flex-col justify-start">
			<SongSection
				v-for="(section, index) in songStore.sections"
				:key="section.id"
				:ref="sectionsRefs.set"
				v-model:section="songStore.sections[index]"
			/>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { copyToClipboard, uid, useQuasar } from 'quasar';
import { Section, useSongStore } from 'src/stores/songStore';
import SongSection from 'src/components/SongSection.vue';
import { useRoute, useRouter } from 'vue-router';
import { onMounted, ref } from 'vue';
import { createPartiture, loadPartiture, updatePartiture } from 'src/utils/partiture';
import { mdiContentSave, mdiPlay, mdiStop, mdiRepeat, mdiPlus } from '@quasar/extras/mdi-v6';
import { useTemplateRefsList } from '@vueuse/core';

let playingAll = ref(false);
let playing = ref(false);
let sectionsRefs = useTemplateRefsList<InstanceType<typeof SongSection>>()
let instrumentsSoundsList =ref<ReturnType<typeof setTimeout>[]>([])

let addSection = (instrumentIndex?: number) => {
	let id = uid();
	let beat = {
		name: '4/4', //TODO utilizar la anterior seccion
		beatsPerBar: 4,
		numOfGroups: 4
	};

	// songStore.sections.forEach(section => section.id >= id ? id = section.id + 1 : null);

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

let play = () => {
	playingAll.value = true;
	playing.value = true;
	let accTime = 0;
	for (let index = 0; index < sectionsRefs.value.length; index++) {
		let playingLength = sectionsRefs.value[index].getPlayingLength();
		accTime += playingLength;

		let playTime = sectionsRefs.value.slice(0, index).reduce((acc, section) => acc + section.getPlayingLength(), 0);

		instrumentsSoundsList.value.push(setTimeout(() => {
			sectionsRefs.value[index].play(false);
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


let songStore = useSongStore()

let route = useRoute()
let router = useRouter()

let $q = useQuasar()

let saveSong = async () => {
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

	$q.notify({
		message: 'Enlace copiado al portapapeles',
		color: 'positive',
		position: 'top-right',
		timeout: 2000
	})
}

onMounted(async () => {
	if (typeof route.query.id === 'string') {
		loadPartiture(route.query.id)

	} else {
		addSection(1);
	}

})

</script>

<style>
</style>
