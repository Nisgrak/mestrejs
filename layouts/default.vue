<template>
	<div class="min-h-screen bg-white text-slate-900">
		<header class="no-print sticky top-0 z-40 border-b border-black/10 bg-[var(--ui-primary)] text-white backdrop-blur">
			<div class="flex w-full items-center justify-between gap-1.5 px-2 py-1.5 md:gap-3 md:py-2 md:px-3">
				<button class="flex min-w-0 cursor-pointer items-center gap-1.5 leading-none md:gap-2" @click="navigateTo({ name: 'Canvas' })">
					<img src="/logo-mestrejs.svg" height="42" width="42" class="h-9 w-9 md:h-[42px] md:w-[42px]" alt="MestreJS Logo" loading="eager" />
					<span class="hidden text-base tracking-tight min-[360px]:inline md:text-lg">
						<span class="font-light">Mestre</span><span class="font-semibold">JS</span>
					</span>
				</button>

				<div v-if="!songStore.user" class="flex shrink-0 items-center gap-1.5 md:gap-2">
					<UTooltip text="Ir a inicio de sesión">
						<UButton size="xs" color="primary" variant="soft" class="min-h-9 whitespace-nowrap border-transparent bg-white/10 px-2.5 text-white hover:bg-white/20 md:text-sm" :to="{ name: 'LoginPage' }">
							Entrar
						</UButton>
					</UTooltip>
					<UTooltip text="Ir a registro">
						<UButton size="xs" color="primary" variant="soft" class="min-h-9 whitespace-nowrap border-transparent bg-white/10 px-2.5 text-white hover:bg-white/20 md:text-sm" :to="{ name: 'RegisterPage' }">
							Registro
						</UButton>
					</UTooltip>
				</div>
				<div v-else class="flex shrink-0 items-center gap-1.5 md:gap-2">
					<UTooltip text="Ver listado de partituras">
						<UButton size="xs" color="primary" variant="soft" class="min-h-9 whitespace-nowrap border-transparent bg-white/10 px-2.5 text-white hover:bg-white/20 md:text-sm" :to="{ name: 'ListPartituresPage' }">Listado</UButton>
					</UTooltip>
					<UTooltip text="Gestionar páginas públicas">
						<UButton size="xs" color="primary" variant="soft" class="min-h-9 whitespace-nowrap border-transparent bg-white/10 px-2.5 text-white hover:bg-white/20 md:text-sm" :to="{ name: 'ListPublicPages' }">Páginas</UButton>
					</UTooltip>
					<UTooltip text="Cerrar sesión">
						<UButton size="xs" color="primary" variant="soft" class="min-h-9 whitespace-nowrap border-transparent bg-white/10 px-2.5 text-white hover:bg-white/20 md:text-sm" @click="logout">
							Salir
						</UButton>
					</UTooltip>
				</div>
			</div>
		</header>

		<main>
			<slot />
		</main>

		<div v-show="route.name !== 'Contact'" class="no-print fixed bottom-5 left-5 z-50">
			<UTooltip text="Contacto">
				<UButton color="primary" variant="solid" square size="lg" icon="i-lucide-circle-help" aria-label="Contacto" :to="{ name: 'Contact' }" />
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

<style>
@media print {
	.no-print {
		display: none !important;
	}
}
</style>
