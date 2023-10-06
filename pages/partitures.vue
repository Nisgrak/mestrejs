<template>
	<q-page class="row items-center justify-evenly">
		<div class="border-1 rounded-lg p-5 w-9/10 md:w-5/10">
			<q-table
				title="Partituras"
				:rows="partitures"
				:columns="columns"
				row-key="name"
				unelevated
				flat
				hide-pagination
			>
				<template #body-cell-actions="{row}">
					<td>
						<q-btn
							flat
							:to="{name: 'Canvas', query: {id: row.id}}"
							:icon="mdiMagnify"
						/>
						<q-btn
							flat
							:icon="mdiTrashCan"
						/>
					</td>
				</template>
			</q-table>
		</div>
	</q-page>
</template>


<script lang="ts" setup>
import { mdiMagnify, mdiTrashCan } from '@quasar/extras/mdi-v6';
import { QTableColumn } from 'quasar';

const { getItems } = useDirectusItems();

definePageMeta({
  name: "ListPartituresPage"
})

let partitures = ref<Partiture[]>([])

let columns: QTableColumn<Partiture>[] = [
	{
		field: 'name',
		label: 'Nombre',
		name:'name',
		align: 'left'
	},
	{
		field: 'song',
		label: 'Ritmo',
		name: 'song',
		align: 'left',
		format: (song) => song?.[0]?.beat?.name || '-'
	},
	{
		field: 'bpm',
		label: 'BPM',
		name:'bpm',
		align: 'left'
	},
	{
		field: 'id',
		label: 'Acciones',
		name:'actions',
		align: 'left'
	},
]

onMounted(async () => {
	let temp = await getItems<Partiture>({collection:'partiture', params: {
		filter: {
					user_created: '$CURRENT_USER'
				}
	}})

	if (!temp || temp.length === 0) {
		return
	}

	partitures.value.length = 0
	partitures.value.push(...temp)

})

</script>
