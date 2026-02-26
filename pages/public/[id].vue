<template>
	<div class="mx-auto w-full max-w-3xl px-4 py-8">
		<UPageCard
			:title="pageName || 'Página pública'"
			description="Accede a las partituras compartidas por el grupo."
		>
			<UAlert
				v-if="errorMessage"
				class="mb-4"
				color="error"
				variant="soft"
				title="No se pudo abrir la página"
				:description="errorMessage"
			/>

			<div v-if="isCheckingAccess" class="py-2 text-sm text-slate-500">
				Comprobando acceso...
			</div>

			<form v-else-if="needsPassword && !isUnlocked" class="grid gap-3" @submit.prevent="unlockPage()">
				<UInput
					v-model="password"
					type="password"
					label="Contraseña"
					placeholder="Introduce la contraseña"
				/>
				<div class="flex justify-end">
					<UButton color="primary" type="submit" :loading="isLoading">Entrar</UButton>
				</div>
			</form>

			<div v-else class="grid gap-3">
				<UAlert
					v-if="partitures.length === 0"
					color="warning"
					variant="soft"
					title="No hay partituras"
					description="Esta página aún no tiene partituras asignadas."
				/>

				<div v-for="partiture in partitures" :key="partiture.id" class="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
					<div>
						<p class="font-medium">{{ partiture.name }}</p>
						<p class="text-sm text-slate-500">BPM {{ partiture.bpm ?? '-' }}</p>
					</div>
					<UButton
						color="primary"
						variant="soft"
						icon="i-lucide-music-2"
						:to="{ name: 'Canvas', query: { id: partiture.id } }"
					>
						Abrir
					</UButton>
				</div>
			</div>
		</UPageCard>
	</div>
</template>

<script lang="ts" setup>
interface PublicPartiture {
	id: string
	name: string
	bpm?: number
}

interface PublicPageResponse {
	id: string
	name: string
	partitures: PublicPartiture[]
}

definePageMeta({
	name: 'PublicPage'
})

const route = useRoute()

const password = ref('')
const isLoading = ref(false)
const isCheckingAccess = ref(true)
const needsPassword = ref(false)
const isUnlocked = ref(false)
const errorMessage = ref('')
const pageName = ref('')
const partitures = ref<PublicPartiture[]>([])

const pageId = computed(() => {
	if (typeof route.params.id !== 'string') {
		return ''
	}

	return route.params.id
})

async function unlockPage(silent = false) {
	if (!pageId.value || isLoading.value) {
		return
	}

	isLoading.value = true
	errorMessage.value = ''

	try {
		const result = await $fetch<PublicPageResponse>(`/api/public-pages/${pageId.value}`, {
			method: 'POST',
			body: {
				password: password.value
			}
		})

		pageName.value = result.name
		partitures.value = result.partitures
		needsPassword.value = false
		isUnlocked.value = true
	} catch (error: any) {
		if (error?.statusCode === 401) {
			needsPassword.value = true
			if (!silent) {
				errorMessage.value = 'Contraseña incorrecta.'
			}
		} else if (error?.statusCode === 404) {
			errorMessage.value = 'La página no existe o no está disponible.'
		} else {
			errorMessage.value = 'Error al validar el acceso. Inténtalo de nuevo.'
		}
	} finally {
		isLoading.value = false
		isCheckingAccess.value = false
	}
}

onMounted(async () => {
	await unlockPage(true)
})
</script>
