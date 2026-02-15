<template>
	<div class="min-h-screen bg-white text-slate-900">
		<header class="sticky top-0 z-40 border-b border-black/10 bg-[var(--ui-primary)] text-white backdrop-blur">
			<div class="flex w-full items-center justify-between gap-3 px-2 py-2 md:px-3">
				<button class="flex cursor-pointer items-center gap-2 leading-none" @click="navigateTo({ name: 'Canvas' })">
					<img src="/logo-mestrejs.svg" height="42" width="42" alt="MestreJS Logo" loading="eager" />
					<span class="text-lg tracking-tight">
						<span class="font-light">Mestre</span><span class="font-semibold">JS</span>
					</span>
				</button>

				<div v-if="!songStore.user" class="flex items-center gap-2">
					<UTooltip text="Ir a inicio de sesion">
						<UButton size="sm" color="primary" variant="soft" class="border-transparent bg-white/10 text-white hover:bg-white/20" :to="{ name: 'LoginPage' }">Iniciar sesion</UButton>
					</UTooltip>
					<UTooltip text="Ir a registro">
						<UButton size="sm" color="primary" variant="soft" class="border-transparent bg-white/10 text-white hover:bg-white/20" :to="{ name: 'RegisterPage' }">Registrate</UButton>
					</UTooltip>
				</div>
				<div v-else class="flex items-center gap-2">
					<UTooltip text="Ver listado de partituras">
						<UButton size="sm" color="primary" variant="soft" class="border-transparent bg-white/10 text-white hover:bg-white/20" :to="{ name: 'ListPartituresPage' }">Listado</UButton>
					</UTooltip>
					<UTooltip text="Cerrar sesion">
						<UButton size="sm" color="primary" variant="soft" class="border-transparent bg-white/10 text-white hover:bg-white/20" @click="logout">Logout</UButton>
					</UTooltip>
				</div>
			</div>
		</header>

		<main>
			<slot />
		</main>

		<div v-show="route.name !== 'Contact'" class="fixed bottom-5 left-5 z-50">
			<UTooltip text="Contacto">
				<UButton color="primary" variant="solid" square icon="i-lucide-circle-help" aria-label="Contacto" :to="{ name: 'Contact' }" />
			</UTooltip>
		</div>
	</div>
</template>

<script lang="ts" setup>
let songStore = useSongStore()
const { logout: logoutDirectus } = useDirectusAuth()
let route = useRoute()

const logout = async () => {
	await logoutDirectus()
	songStore.user = undefined
}
</script>
