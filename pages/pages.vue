<template>
	<q-page class="row items-center justify-evenly">
		<div class="border-1 rounded-lg p-5 w-9/10 md:w-5/10">
			<q-table title="Páginas públicas" :rows="pages" :columns="columns" row-key="name" unelevated flat
				hide-pagination>
				<template v-slot:top="props">
					<div class="col-2 q-table__title">Páginas públicas</div>

					<q-space />

					<q-btn no-caps outline label="Crear" color="dark" @click="showDialogCreate = !showDialogCreate" />
				</template>
				<template #body-cell-actions="{ row }">
					<td>
						<q-btn flat :to="{ name: 'Canvas', query: { id: row.id } }" :icon="mdiMagnify" />
						<q-btn flat
							@click="row.password = undefined; loadedPage = JSON.parse(JSON.stringify(row)); showDialogCreate = true"
							:icon="mdiPencil" />
						<q-btn flat :icon="mdiTrashCan" />
					</td>
				</template>
			</q-table>
		</div>

		<q-dialog v-model="showDialogCreate">

			<q-card class="my-card">
				<q-form @submit="createNewPage" class="q-gutter-md">


					<q-card-section class="grid gap-sm">
						<q-input filled v-model="loadedPage.name" label="Nombre *" lazy-rules
							:rules="[val => val && val.length > 0 || 'Campo obligatorio']" />

						<q-input filled v-model="loadedPage.password" label="Contraseña" />

						<q-select filled v-model="loadedPage.partitures" use-input use-chips multiple input-debounce="0"
							:options="partitures" @filter="filterFn" option-label="name" option-value="id" />

					</q-card-section>
					<q-separator />

					<q-card-actions align="right">
						<q-btn label="Guardar" type="submit" color="primary" unelevated />
						<q-btn label="Cancelar" @click="showDialogCreate = false" unelevated />
					</q-card-actions>
				</q-form>

			</q-card>
		</q-dialog>
	</q-page>
</template>


<script lang="ts" setup>
import { mdiMagnify, mdiPencil, mdiTrashCan } from '@quasar/extras/mdi-v6';
import { type QTableColumn } from 'quasar';
import type { Page } from "@/stores/songStore"

const { getItems, createItems } = useDirectusItems();

definePageMeta({
	name: "ListPublicPages"
})

let pages = ref<Page[]>([])
let partitures = ref<Partiture[]>([])
let filteredPartitures = ref<Partiture[]>([])

let showDialogCreate = ref(true)

let loadedPage = ref<Partial<Page>>({
	name: "",
	password: "",
	partitures: []
})

let columns: QTableColumn<Page>[] = [
	{
		field: 'name',
		label: 'Nombre',
		name: 'name',
		align: 'left'
	},
	{
		field: 'id',
		label: 'Acciones',
		name: 'actions',
		align: 'left'
	},
]

async function createNewPage() {

	await createItems<Page>({
		collection: 'page',
		items: [
			{
				name: loadedPage.value.name,
				password: loadedPage.value.password,
				partitures: loadedPage.value.partitures!.map(p => ({ partiture_id: p.id! })),
			}
		],
	})

}

onMounted(async () => {
	await loadPages()

	let temp2 = await getItems<Partiture>({
		collection: 'partiture',
		params: {
			filter: {
				user_created: '$CURRENT_USER'
			},
		}
	})

	if (temp2 && temp2.length !== 0) {
		partitures.value.length = 0
		partitures.value.push(...temp2)
	}

})

async function loadPages() {
	let temp = await getItems<Page>({
		collection: 'page',
		params: {
			filter: {
				user_created: '$CURRENT_USER'
			},
		}
	})

	if (temp && temp.length !== 0) {
		pages.value.length = 0
		pages.value.push(...temp)
	}
}


function filterFn(val: string, update: (cb: () => void) => void) {
	if (val === '') {
		update(() => {
			filteredPartitures.value = partitures.value

			// here you have access to "ref" which
			// is the Vue reference of the QSelect
		})
		return
	}

	update(() => {
		const needle = val.toLowerCase()
		filteredPartitures.value = partitures.value.filter(v => v.name.toLowerCase().indexOf(needle) > -1)
	})
}

</script>
