<template>
	<q-page class="row items-center justify-evenly">
		<div class="border-1 border-solid border-gray-200 rounded-lg p-5 w-9/10 md:w-3/10">
			<div class="text-xl mb-5 text-center">
				Inicia sesión
			</div>
			<div>
				<q-form greedy @submit="login">
					<q-input v-model="email" label="Email" autocomplete="email"
						:rules="[val => val && val.length > 0 || 'El campo es obligatorio']" />
					<q-input v-model="password" label="Contraseña" autocomplete="password" type="password" class=""
						:rules="[val => val && val.length > 0 || 'El campo es obligatorio']" />

					<q-btn flat unelevated no-caps class="pl-0 mb-2" color="primary" @click="changePassword"
						label="He olvidado la contraseña">
					</q-btn>


					<q-btn no-caps color="primary" class="w-full" type="submit" label="Login">
					</q-btn>
				</q-form>
			</div>
		</div>
	</q-page>
</template>


<script lang="ts" setup>
import { useQuasar } from 'quasar';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const { login: loginDirectus, requestPasswordReset } = useDirectusAuth();

definePageMeta({
	name: "LoginPage"
})

let email = ref('')
let password = ref('')
let $q = useQuasar()
let router = useRouter()
let songStore = useSongStore()

function emailBool(value: string): boolean {
	return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(value)
}

let changePassword = () => {
	$q.dialog({
		title: 'Cambiar contraseña',
		message: '¿Cuál es tu email?',
		prompt: {
			model: '',
			type: 'email',
			isValid: emailBool,
		},
		ok: 'Cambiar',
		cancel: 'Cancelar',
		persistent: true,
	}).onOk(async (email) => {
		let resetPasswordRoute = router
			.getRoutes()
			.find((route) => route.name === 'ResetPasswordPage');

		if (resetPasswordRoute) {
			let changePasswordUrl = window.location.origin;
			let path = `${process.env.VUE_ROUTER_BASE || ""}${resetPasswordRoute.path}`
			path = path.replace('//', '/')
			await requestPasswordReset({ email, reset_url: changePasswordUrl + path });
			$q.dialog({
				title: 'Cambiar contraseña',
				message:
					'Recibirás un email con las instrucciones para cambiar tu contraseña',
				persistent: true,
			});
		}
	});
};

let login = async () => {
	if (email.value !== '' && password.value !== '') {
		try {

			await loginDirectus({
				email: email.value,
				password: password.value
			})

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
