<template>
	<div class="mx-auto w-full max-w-5xl px-4 py-8">
		<UPageCard
			title="Páginas públicas"
			description="Agrupa partituras en una página compartible con acceso por contraseña."
		>
			<template #footer>
				<div class="flex justify-end">
					<UButton color="primary" icon="i-lucide-plus" @click="showDialogCreate = true">
						Crear página
					</UButton>
				</div>
			</template>

			<UAlert
				v-if="errorMessage"
				class="mb-4"
				color="error"
				variant="soft"
				title="No se pudieron cargar las páginas"
				:description="errorMessage"
			/>

			<div class="overflow-x-auto">
				<table class="w-full border-collapse text-left">
					<thead>
						<tr class="border-b border-slate-200">
							<th class="py-2">Nombre</th>
							<th class="py-2">Partituras</th>
							<th class="py-2">Acciones</th>
						</tr>
					</thead>
					<tbody>
						<tr v-if="pages.length === 0">
							<td colspan="3" class="py-8 text-center text-slate-500">
								No tienes páginas públicas todavía.
							</td>
						</tr>
						<tr v-for="row in pages" :key="row.id" class="border-b border-slate-100">
							<td class="py-2">{{ row.name }}</td>
							<td class="py-2">{{ row.partitures?.length ?? 0 }}</td>
							<td class="py-2">
								<div class="flex flex-wrap gap-2">
									<UTooltip text="Editar página">
										<UButton
											color="neutral"
											variant="ghost"
											square
											icon="i-lucide-pencil"
											aria-label="Editar página"
											@click="openEditDialog(row)"
										/>
									</UTooltip>
									<UTooltip text="Abrir página pública">
										<UButton
											color="neutral"
											variant="ghost"
											square
											icon="i-lucide-eye"
											aria-label="Abrir página pública"
											:to="getPublicPath(row.id)"
										/>
									</UTooltip>
									<UTooltip text="Copiar enlace público">
										<UButton
											color="neutral"
											variant="ghost"
											square
											icon="i-lucide-link"
											aria-label="Copiar enlace público"
											@click="copyPublicLink(row.id)"
										/>
									</UTooltip>
								</div>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</UPageCard>

		<UModal
			v-model:open="showDialogCreate"
			:title="editingPageId ? 'Editar página pública' : 'Crear página pública'"
			:description="editingPageId ? 'Actualiza nombre, contraseña y partituras de la página.' : 'Configura los datos para generar una nueva página con acceso público.'"
		>
			<template #body>
				<form class="grid gap-3" @submit.prevent="savePage">
					<UFormField label="Nombre" required>
						<UInput v-model="loadedPage.name" />
					</UFormField>
					<UFormField
						label="Contraseña de acceso público"
						help="Quien tenga este enlace necesitará esta contraseña para ver las partituras."
					>
						<UInput
							v-model="loadedPage.password"
							type="password"
							:placeholder="editingPageId ? 'Deja vacío para mantener la actual' : 'Opcional'"
						/>
					</UFormField>
					<UFormField label="Partituras">
						<USelectMenu
							v-model="selectedPartitureIds"
							placeholder="Selecciona una o varias partituras"
							:items="partitureOptions"
							value-key="value"
							label-key="label"
							multiple
							searchable
						/>
					</UFormField>
					<div class="mt-2 flex justify-end gap-2">
						<UButton color="neutral" variant="ghost" @click="closeDialog">Cancelar</UButton>
						<UButton color="primary" type="submit" :loading="isSaving">{{ editingPageId ? 'Actualizar' : 'Guardar' }}</UButton>
					</div>
				</form>
			</template>
		</UModal>
	</div>
</template>

<script lang="ts" setup>
interface PartitureLookup {
	id: string
	name: string
}

interface PagePartitureRelation {
	partiture_id?: string | PartitureLookup | null
}

interface PageRecord {
	id: string
	name: string
	password?: string | null
	partitures?: PagePartitureRelation[]
}

const toast = useToast()

definePageMeta({
	name: 'ListPublicPages',
	middleware: 'auth'
})

const pages = ref<PageRecord[]>([])
const partitures = ref<Partiture[]>([])
const showDialogCreate = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')
const selectedPartitureIds = ref<string[]>([])
const editingPageId = ref<string | null>(null)

const loadedPage = ref({
	name: '',
	password: ''
})

const partitureOptions = computed(() => {
	return partitures.value.map((partiture) => ({
		label: partiture.name,
		value: partiture.id
	}))
})

function getPublicPath(pageId: string) {
	return `/public/${pageId}`
}

async function copyPublicLink(pageId: string) {
	const path = getPublicPath(pageId)
	await navigator.clipboard.writeText(`${window.location.origin}${path}`)
	toast.add({
		title: 'Enlace copiado',
		description: 'Comparte este enlace con tu público.',
		color: 'primary'
	})
}

function closeDialog() {
	showDialogCreate.value = false
	editingPageId.value = null
	loadedPage.value = { name: '', password: '' }
	selectedPartitureIds.value = []
}

function getPartitureId(relation: PagePartitureRelation) {
	if (!relation.partiture_id) {
		return null
	}

	if (typeof relation.partiture_id === 'string') {
		return relation.partiture_id
	}

	return relation.partiture_id.id ?? null
}

function openEditDialog(page: PageRecord) {
	editingPageId.value = page.id
	loadedPage.value = {
		name: page.name,
		password: ''
	}
	selectedPartitureIds.value = (page.partitures ?? [])
		.map((relation) => getPartitureId(relation))
		.filter((id): id is string => Boolean(id))
	showDialogCreate.value = true
}

async function savePage() {
	if (!loadedPage.value.name || isSaving.value) {
		return
	}

	isSaving.value = true

	try {
		const pagePayload: Partial<PageRecord> = {
			name: loadedPage.value.name.trim()
		}

		const normalizedPassword = loadedPage.value.password.trim()

		if (editingPageId.value) {
			await $fetch(`/api/pages/${editingPageId.value}`, {
				method: 'PATCH',
				body: {
					name: pagePayload.name,
					password: normalizedPassword,
					partitureIds: selectedPartitureIds.value
				}
			})
		} else {
			await $fetch('/api/pages', {
				method: 'POST',
				body: {
					name: pagePayload.name,
					password: normalizedPassword,
					partitureIds: selectedPartitureIds.value
				}
			})
		}

		const wasEditing = Boolean(editingPageId.value)
		closeDialog()
		await loadPages()
		toast.add({
			title: wasEditing ? 'Página actualizada' : 'Página creada',
			description: wasEditing
				? 'Los cambios se han guardado correctamente.'
				: 'Tu página pública ya está disponible para compartir.',
			color: 'primary'
		})
	} catch {
		toast.add({
			title: editingPageId.value ? 'No se pudo actualizar la página' : 'No se pudo crear la página',
			color: 'error'
		})
	} finally {
		isSaving.value = false
	}
}

async function loadPages() {
	errorMessage.value = ''

	try {
		const temp = await $fetch<PageRecord[]>('/api/pages')

		pages.value = temp && temp.length !== 0 ? [...temp] : []
	} catch {
		pages.value = []
		errorMessage.value = 'Revisa tu sesión e inténtalo de nuevo.'
	}
}

async function loadPartitures() {
	const temp = await $fetch<Partiture[]>('/api/partitures')

	partitures.value = temp && temp.length !== 0 ? [...temp] : []
}

onMounted(async () => {
	await Promise.all([loadPages(), loadPartitures()])
})
</script>
