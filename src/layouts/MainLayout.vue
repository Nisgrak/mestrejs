<template>
	<q-layout view="hHh Lpr lFf">
		<q-header>
			<q-toolbar>
				<q-toolbar-title
					class="cursor-pointer"
					@click="router.push({name: 'Canvas'})"
				>
					<q-img
						src="/logo-mestrejs.svg"
						height="50px"
						width="50px"
						square
					/>
					<span class="font-light">Mestre</span>
					<span class="font-medium">JS</span>
				</q-toolbar-title>

				<div
					v-if="!songStore.user"
					class="gap-3 flex"
				>
					<q-btn
						no-caps
						outline
						label="Iniciar sesión"
						:to="{name: 'LoginPage'}"
					/>
					<q-btn
						no-caps
						outline
						label="Registrate"
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
					/>
					<q-btn
						flat
						no-caps
						outline
						label="Logout"
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
			<router-view />
		</q-page-container>
	</q-layout>
</template>

<script lang="ts" setup>
import { mdiMenu } from '@quasar/extras/mdi-v6';
import { useSongStore } from 'src/stores/songStore';
import directus from 'src/utils/directus';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

let songStore = useSongStore()
let router = useRouter()

let logout = () => {
	directus.auth.logout()
	songStore.user = undefined
}

const leftDrawerOpen = ref(false)
</script>
