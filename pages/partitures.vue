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
							<th class="py-2">Páginas</th>
							<th class="py-2">Visibilidad</th>
							<th class="py-2">Acciones</th>
						</tr>
					</thead>
					<tbody>
						<tr v-if="partitures.length === 0">
							<td colspan="6" class="py-8 text-center text-slate-500">
								No tienes partituras todavía.
							</td>
						</tr>
						<tr
							v-for="partiture in partitures"
							:key="partiture.id"
							class="border-b border-slate-100"
						>
							<td class="py-2">{{ partiture.name }}</td>
							<td class="py-2">{{ partiture.song?.[0]?.beat?.name || '-' }}</td>
							<td class="py-2">{{ partiture.bpm }}</td>
							<td class="py-2">{{ partiture.page_count ?? 0 }}</td>
							<td class="py-2">{{ visibilityLabel(partiture.visibility) }}</td>
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
									<UTooltip text="Configurar compartición">
										<UButton
											color="neutral"
											variant="ghost"
											square
											icon="i-lucide-share-2"
											aria-label="Configurar compartición"
											@click="openShareModal(partiture)"
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

		<UModal
			v-model:open="showShareModal"
			title="Compartir partitura"
			description="Configura si esta partitura es privada, pública o protegida por contraseña."
			:ui="{ content: 'sm:max-w-md' }"
		>
			<template #body>
				<div class="grid w-full gap-3">
					<UFormField label="Visibilidad" class="w-full">
						<USelectMenu
							v-model="shareVisibility"
							class="w-full"
							:items="visibilityOptions"
							value-key="value"
							label-key="label"
						/>
					</UFormField>

					<UFormField v-if="shareVisibility === 'password'" label="Contraseña" required class="w-full">
						<UInput
							v-model="sharePassword"
							type="password"
							placeholder="Introduce contraseña"
							class="w-full"
						/>
					</UFormField>

					<div class="flex justify-end gap-2">
						<UButton color="neutral" variant="ghost" @click="closeShareModal">Cancelar</UButton>
						<UButton color="primary" :loading="isSavingShare" @click="saveShareSettings">Guardar</UButton>
					</div>
				</div>
			</template>
		</UModal>
	</div>
</template>

<script lang="ts" setup>
type Visibility = 'private' | 'public' | 'password' | null

interface PartitureRow {
	id: string
	name: string
	bpm: number
	song?: any[]
	page_count?: number
	visibility: Visibility
	user_created?: string | null
}

const { deleteItems } = useDirectusItems()
const toast = useToast()

const visibilityOptions = [
	{ label: 'Privada', value: 'private' },
	{ label: 'Pública', value: 'public' },
	{ label: 'Con contraseña', value: 'password' }
]

definePageMeta({
	name: 'ListPartituresPage',
	middleware: 'auth'
})

const partitures = ref<PartitureRow[]>([])
const showDeleteModal = ref(false)
const selectedPartitureId = ref<string | null>(null)
const showShareModal = ref(false)
const selectedSharePartitureId = ref<string | null>(null)
const shareVisibility = ref<'private' | 'public' | 'password'>('private')
const sharePassword = ref('')
const isSavingShare = ref(false)

async function deletePartiture(id: string) {
	selectedPartitureId.value = id
	showDeleteModal.value = true
}

function visibilityLabel(visibility: Visibility) {
	switch (visibility) {
		case 'private':
			return 'Privada'
		case 'password':
			return 'Con contraseña'
		case 'public':
			return 'Pública'
		default:
			return 'Pública'
	}
}

function openShareModal(partiture: PartitureRow) {
	selectedSharePartitureId.value = partiture.id
	shareVisibility.value = partiture.visibility ?? 'public'
	sharePassword.value = ''
	showShareModal.value = true
}

function closeShareModal() {
	showShareModal.value = false
	selectedSharePartitureId.value = null
	sharePassword.value = ''
}

async function saveShareSettings() {
	if (!selectedSharePartitureId.value || isSavingShare.value) {
		return
	}

	if (shareVisibility.value === 'password' && !sharePassword.value.trim()) {
		toast.add({
			title: 'Falta la contraseña',
			description: 'Para esta visibilidad necesitas definir una contraseña.',
			color: 'warning'
		})
		return
	}

	isSavingShare.value = true

	try {
		await $fetch(`/api/partitures/${selectedSharePartitureId.value}/share`, {
			method: 'POST',
			body: {
				visibility: shareVisibility.value,
				password: sharePassword.value
			}
		})

		toast.add({
			title: 'Compartición actualizada',
			description: `La partitura ahora está en modo ${visibilityLabel(shareVisibility.value)}.`,
			color: 'primary'
		})

		closeShareModal()
		await refresh()
	} catch {
		toast.add({
			title: 'No se pudo actualizar la compartición',
			color: 'error'
		})
	} finally {
		isSavingShare.value = false
	}
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
	const temp = await $fetch<PartitureRow[]>('/api/partitures')

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
