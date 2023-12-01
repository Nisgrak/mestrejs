<template>
	<VitePwaManifest />
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
</template>


<script lang="ts" setup>
import { useQuasar } from 'quasar';
import { onMounted } from 'vue';
import { migratePartiture } from './utils/migrateVersions';

useServerSeoMeta({
	title: "MestreJS",
	description: "The place where brazilian music born",
	ogTitle: "MestreJS",
	ogDescription: "The place where brazilian music born",
	themeColor: "#E47C44"
})

let $q = useQuasar()
let songStore = useSongStore()

$q.iconMapFn = (iconName: string) => {
	if (iconName.startsWith('app:')) {
		let icon = iconName.replace('app:', '');
		return { icon: `svguse:/app-icons/${icon}.svg#${icon}` };
	}
};

onMounted(async () => {

	const { token } = useDirectusToken();

	if (songStore.user === undefined && token) {
		songStore.user = (await useDirectusUser()).value
	}

})
</script>

<style>
* {
	box-sizing: border-box;
	border-width: 0;
	border-style: solid;
	border-color: #e5e7eb
}
</style>
