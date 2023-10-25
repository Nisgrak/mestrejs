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
import { useSongStore } from '../stores/songStore';
import { ref } from 'vue';

definePageMeta({
  name: "RegisterPage"
})

let email = ref('')
let password = ref('')
let $q = useQuasar()
let songStore = useSongStore()
const { createUser, login } = useDirectusAuth();

let register = async ()=> {
	if (email.value !== '' && password.value !== '') {
		try {

			await createUser({
				email: email.value,
				password: password.value,
			});

			await login({
				email: email.value,
				password: password.value
			});

			songStore.user = (await useDirectusUser()).value

			await navigateTo({
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
