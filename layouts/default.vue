<template>
	<q-layout view="hHh Lpr lFf">
		<q-header>
			<q-toolbar>
				<q-toolbar-title
					class="cursor-pointer"
					@click="navigateTo({name: 'Canvas'})"
				>
					<img
						src="/logo-mestrejs.svg"
						height="50px"
						width="50px"
						square
						alt="MestreJS Logo"
						loading="eager"
					/>
					<span class="font-light text-black">Mestre</span>
					<span class="font-medium text-black">JS</span>
				</q-toolbar-title>

				<div
					v-if="!songStore.user"
					class="gap-3 flex"
				>
					<q-btn
						no-caps
						outline
						label="Iniciar sesión"
						color="dark"
						:to="{name: 'LoginPage'}"
					/>
					<q-btn
						no-caps
						outline
						label="Registrate"
						color="dark"
						:to="{name: 'RegisterPage'}"
					/>
				</div>
				<div
					v-else
				>
					<q-btn
						flat
						no-caps
						outline
						label="Listado"
						:to="{name: 'ListPartituresPage'}"
						color="dark"
					/>
					<q-btn
						flat
						no-caps
						outline
						label="Logout"
						color="dark"
						@click="logout"
					/>
				</div>
				<!-- <q-btn
					flat
					dense
					round
					:icon="mdiMenu"
					aria-label="Menu"
					@click="leftDrawerOpen = !leftDrawerOpen"
				/> -->
			</q-toolbar>
		</q-header>

		<!-- <q-drawer
			v-model="leftDrawerOpen"
			show-if-above
			bordered
		>
			<q-list>
				<q-item-label
					header
				>
					Essential Links
				</q-item-label>

				<EssentialLink
					v-for="link in essentialLinks"
					:key="link.title"
					v-bind="link"
				/>
			</q-list>
		</q-drawer> -->

		<q-page-container>
			<slot />
		</q-page-container>
	</q-layout>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

let songStore = useSongStore()
const { logout: logoutDirectus } = useDirectusAuth();

let logout = () => {
	logoutDirectus()
	songStore.user = undefined
}

const leftDrawerOpen = ref(false)
</script>
