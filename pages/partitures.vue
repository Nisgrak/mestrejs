<template>
	<div class="mx-auto w-full max-w-5xl px-4 py-8">
		<div class="rounded-lg border border-slate-200 bg-white/80 p-5">
			<h2 class="mb-4 text-xl font-semibold">Partituras</h2>
			<div class="overflow-x-auto">
				<table class="w-full border-collapse text-left">
					<thead>
						<tr class="border-b border-slate-200">
							<th class="py-2">Nombre</th>
							<th class="py-2">Ritmo</th>
							<th class="py-2">BPM</th>
							<th class="py-2">Acciones</th>
						</tr>
					</thead>
					<tbody>
						<tr
							v-for="partiture in partitures"
							:key="partiture.id"
							class="border-b border-slate-100"
						>
							<td class="py-2">{{ partiture.name }}</td>
							<td class="py-2">{{ partiture.song?.[0]?.beat?.name || '-' }}</td>
							<td class="py-2">{{ partiture.bpm }}</td>
							<td class="py-2">
								<div class="flex gap-2">
									<UTooltip text="Ver partitura">
										<UButton
											color="neutral"
											variant="ghost"
											square
											icon="i-lucide-eye"
											aria-label="Ver partitura"
											:to="{ name: 'Canvas', query: { id: partiture.id } }"
										/>
									</UTooltip>
									<UTooltip text="Eliminar partitura">
										<UButton
											color="error"
											variant="ghost"
											square
											icon="i-lucide-trash-2"
											aria-label="Eliminar partitura"
											@click="deletePartiture(partiture.id)"
										/>
									</UTooltip>
								</div>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>

		<UModal
			v-model:open="showDeleteModal"
			title="Eliminar partitura"
			description="Confirma si quieres eliminar esta partitura."
		>
			<template #body>
				<div class="grid gap-3">
					<p>¿Estás seguro que quieres eliminar esta partitura?</p>
					<div class="flex justify-end gap-2">
						<UButton
							color="neutral"
							variant="ghost"
							@click="showDeleteModal = false"
						>Cancelar</UButton>
						<UButton
							color="error"
							@click="confirmDeletePartiture"
						>Eliminar</UButton>
					</div>
				</div>
			</template>
		</UModal>
	</div>
</template>

<script lang="ts" setup>
const { getItems, deleteItems } = useDirectusItems()

definePageMeta({
	name: 'ListPartituresPage'
})

const partitures = ref<Partiture[]>([])
const showDeleteModal = ref(false)
const selectedPartitureId = ref<string | null>(null)

async function deletePartiture(id: string) {
	selectedPartitureId.value = id
	showDeleteModal.value = true
}

async function confirmDeletePartiture() {
	if (!selectedPartitureId.value) {
		return
	}

	await deleteItems({ collection: 'partiture', items: [selectedPartitureId.value] })
	selectedPartitureId.value = null
	showDeleteModal.value = false
	await refresh()
}

async function refresh() {
	const temp = await getItems<Partiture>({
		collection: 'partiture',
		params: { filter: { user_created: '$CURRENT_USER' } }
	})

	if (!temp || temp.length === 0) {
		partitures.value = []
		return
	}

	partitures.value = [...temp]
}

onMounted(async () => {
	await refresh()
})
</script>
