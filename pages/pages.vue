<template>
	<div class="mx-auto w-full max-w-5xl px-4 py-8">
		<div class="rounded-lg border border-slate-200 bg-white/80 p-5">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-xl font-semibold">Paginas publicas</h2>
				<UButton color="neutral" variant="outline" @click="showDialogCreate = true">Crear</UButton>
			</div>

			<div class="overflow-x-auto">
				<table class="w-full border-collapse text-left">
					<thead>
						<tr class="border-b border-slate-200">
							<th class="py-2">Nombre</th>
							<th class="py-2">Acciones</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="row in pages" :key="row.id" class="border-b border-slate-100">
							<td class="py-2">{{ row.name }}</td>
							<td class="py-2">
							<UTooltip text="Ver pagina">
								<UButton color="neutral" variant="ghost" square icon="i-lucide-eye" aria-label="Ver pagina" :to="{ name: 'Canvas', query: { id: row.id } }" />
							</UTooltip>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>

		<UModal v-model:open="showDialogCreate" title="Crear pagina publica" description="Configura los datos para generar una nueva pagina publica.">
			<template #body>
				<form class="grid gap-3" @submit.prevent="createNewPage">
					<UInput v-model="loadedPage.name" label="Nombre" required />
					<UInput v-model="loadedPage.password" label="Contrasena" />
					<label class="text-sm">Partituras</label>
					<select
						multiple
						class="min-h-28 rounded-md border border-slate-300 bg-white px-3 py-2"
						@change="onPartituresChange"
					>
						<option v-for="partiture in partitures" :key="partiture.id" :value="partiture.id">
							{{ partiture.name }}
						</option>
					</select>
					<div class="mt-2 flex justify-end gap-2">
						<UButton color="neutral" variant="ghost" @click="showDialogCreate = false">Cancelar</UButton>
						<UButton color="primary" type="submit">Guardar</UButton>
					</div>
				</form>
			</template>
		</UModal>
	</div>
</template>

<script lang="ts" setup>
import type { Page } from '@/stores/songStore'

const { getItems, createItems } = useDirectusItems()

definePageMeta({
	name: 'ListPublicPages'
})

const pages = ref<Page[]>([])
const partitures = ref<Partiture[]>([])
const showDialogCreate = ref(false)

const loadedPage = ref<Partial<Page>>({
	name: '',
	password: '',
	partitures: []
})

async function createNewPage() {
	if (!loadedPage.value.name) {
		return
	}

	await createItems<Page>({
		collection: 'page',
		items: [
			{
				name: loadedPage.value.name,
				password: loadedPage.value.password,
				partitures: loadedPage.value.partitures!.map((p) => ({ partiture_id: p.id! }))
			}
		]
	})

	showDialogCreate.value = false
	loadedPage.value = { name: '', password: '', partitures: [] }
	await loadPages()
}

async function loadPages() {
	const temp = await getItems<Page>({
		collection: 'page',
		params: { filter: { user_created: '$CURRENT_USER' } }
	})

	pages.value = temp && temp.length !== 0 ? [...temp] : []
}

onMounted(async () => {
	await loadPages()

	const temp2 = await getItems<Partiture>({
		collection: 'partiture',
		params: { filter: { user_created: '$CURRENT_USER' } }
	})

	partitures.value = temp2 && temp2.length !== 0 ? [...temp2] : []
})

function onPartituresChange(event: Event) {
	const target = event.target as HTMLSelectElement
	const ids = new Set(Array.from(target.selectedOptions).map((option) => option.value))
	loadedPage.value.partitures = partitures.value.filter((partiture) => ids.has(partiture.id))
}
</script>
