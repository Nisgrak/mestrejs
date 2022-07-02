<template>
	<q-page class="row items-center justify-evenly">
		<div class="border-1 rounded-lg p-5 w-9/10 md:w-3/10">
			<q-list>
				<q-item
					v-for="partiture in partitures"
					:key="partiture.id"
					v-ripple
					clickable
					:to="{name: 'Canvas', query: {id: partiture.id}}"
				>
					<q-item-section>{{ partiture.name }} {{ partiture.song[0].beat.name }} {{ partiture.bpm }}</q-item-section>
				</q-item>
			</q-list>
		</div>
	</q-page>
</template>


<script lang="ts" setup>
import { useQuasar } from 'quasar';
import { useSongStore } from 'src/stores/songStore';
import directus, { Partiture } from 'src/utils/directus';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';


let partitures = ref<Partiture[]>([])

onMounted(async () => {
	let temp = await directus.items('partiture').readByQuery({
		filter: {
			user_created: '$CURRENT_USER'
		}
	})

	if (!temp.data) {
		return
	}

	partitures.value.length = 0
	partitures.value.push(...temp.data)

})

</script>
