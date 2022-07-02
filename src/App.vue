<template>
	<router-view />
</template>


<script lang="ts" setup>
import { useQuasar } from 'quasar';
import { onMounted } from 'vue';
import { useSongStore } from './stores/songStore';
import directus from './utils/directus';


let $q = useQuasar()
let songStore = useSongStore()

$q.iconMapFn = (iconName: string) => {
	if (iconName.startsWith('app:')) {
		let icon = iconName.replace('app:', '');
		return { icon: `svguse:/app-icons/${icon}.svg#${icon}` };
	}
};

onMounted(async () => {
	if (songStore.user === undefined && directus.auth.token) {
		songStore.user = await directus.users.me.read()
	}

})
</script>
