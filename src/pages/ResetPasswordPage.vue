<template>
	<q-page class="row items-center justify-evenly">
		<div class="border-1 rounded-lg p-5 w-9/10 md:w-3/10">
			<div class="text-xl mb-5 text-center">
				Resetea tu contraseña
			</div>
			<div>
				<q-form
					greedy
					@submit="register"
				>
					<q-input
						v-model="password"
						label="Contraseña"
						autocomplete="password"
						type="password"
						:rules="[ val => val && val.length > 0 || 'El campo es obligatorio']"
					/>

					<q-btn
						no-caps
						color="primary"
						class="w-full"
						type="submit"
					>
						Resetear contraseña
					</q-btn>
				</q-form>
			</div>
		</div>
	</q-page>
</template>


<script lang="ts" setup>
import { useQuasar } from 'quasar';
import { useSongStore } from 'src/stores/songStore';
import directus from 'src/utils/directus';
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';

let password = ref('')
let $q = useQuasar()
let router = useRouter()
let route = useRoute()
let songStore = useSongStore()

let register = async ()=> {
	if (password.value !== '') {
		try {

			if (!route.query.token || typeof route.query.token !== 'string') {
				return router.push({ name: 'Home' });
			}

			await directus.auth.password.reset(route.query.token, password.value);

			router.push({
				name: 'LoginPage'
			})
		} catch (err) {
			$q.notify({
				message: 'Error al resetear la contraseña',
				color: 'negative',
				position: 'top',
				timeout: 5000
			})
		}
	}
}
</script>
