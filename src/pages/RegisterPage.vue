<template>
	<q-page class="row items-center justify-evenly">
		<div class="border-1 rounded-lg p-5 w-9/10 md:w-3/10">
			<div class="text-xl mb-5 text-center">
				Crea tu cuenta
			</div>
			<div>
				<q-form
					greedy
					@submit="register"
				>
					<q-input
						v-model="email"
						label="Email"
						autocomplete="email"
						:rules="[ val => val && val.length > 0 || 'El campo es obligatorio']"
					/>
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
						Crear cuenta
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
import { useRouter } from 'vue-router';

let email = ref('')
let password = ref('')
let $q = useQuasar()
let router = useRouter()
let songStore = useSongStore()

let register = async ()=> {
	if (email.value !== '' && password.value !== '') {
		try {

			await directus.users.createOne({
				email: email.value,
				password: password.value
			});

			await directus.auth.login({
				email: email.value,
				password: password.value
			});

			songStore.user = await directus.users.me.read()

			router.push({
				name: 'Canvas'
			})
		} catch (err) {
			$q.notify({
				message: 'Error al iniciar sesión',
				color: 'negative',
				position: 'top',
				timeout: 5000
			})
		}
	}
}
</script>
