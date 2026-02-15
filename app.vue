<template>
	<UApp>
		<VitePwaManifest />
		<NuxtLayout>
			<NuxtPage />
		</NuxtLayout>
	</UApp>
</template>


<script lang="ts" setup>
import { onMounted } from 'vue';
import unmuteAudio from "unmute-ios-audio";
import posthog from 'posthog-js';

useServerSeoMeta({
	title: "MestreJS",
	description: "The place where brazilian music born",
	ogTitle: "MestreJS",
	ogDescription: "The place where brazilian music born",
	themeColor: "#E47C44"
})

let songStore = useSongStore()

onMounted(async () => {

	unmuteAudio();

	const { token } = useDirectusToken();
	const { fetchUser } = useDirectusAuth();

	if (songStore.user === undefined && token) {
		songStore.user = (await useDirectusUser()).value
		posthog.identify(songStore.user?.id, { email: songStore.user?.email })
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
