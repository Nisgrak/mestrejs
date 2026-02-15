<template>
	<div class="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4">
		<UPageCard class="w-full">
			<UAuthForm
				ref="authForm"
				title="Inicia sesion"
				description="Accede para guardar y compartir tus partituras."
				icon="i-lucide-log-in"
				:fields="fields"
				:submit="{ label: 'Login', color: 'primary', block: true }"
				@submit="login"
			>
				<template #password-hint>
					<UButton color="primary" variant="link" class="px-0" @click="changePassword">
						He olvidado la contrasena
					</UButton>
				</template>
			</UAuthForm>
		</UPageCard>
	</div>

	<UModal v-model:open="showResetPasswordModal" title="Recuperar contrasena" description="Introduce tu email para recibir el enlace de recuperacion.">
		<template #body>
			<div class="grid gap-3">
				<UInput v-model="resetPasswordEmail" label="Email" autocomplete="email" />
				<div class="flex justify-end gap-2">
					<UButton color="neutral" variant="ghost" @click="showResetPasswordModal = false">Cancelar</UButton>
					<UButton color="primary" @click="sendResetPasswordEmail">Enviar</UButton>
				</div>
			</div>
		</template>
	</UModal>
</template>

<script lang="ts" setup>
import posthog from 'posthog-js'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'

const { login: loginDirectus, requestPasswordReset } = useDirectusAuth()

definePageMeta({
	name: 'LoginPage'
})

const router = useRouter()
const songStore = useSongStore()
const toast = useToast()
const showResetPasswordModal = ref(false)
const resetPasswordEmail = ref('')
const authForm = useTemplateRef('authForm')

const fields: AuthFormField[] = [
	{ name: 'email', type: 'email', label: 'Email', required: true, placeholder: 'tu@email.com' },
	{ name: 'password', type: 'password', label: 'Contrasena', required: true, placeholder: 'Tu contrasena' }
]

interface LoginFormState {
	email: string
	password: string
}

function emailBool(value: string): boolean {
	return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(value)
}

const changePassword = async () => {
	const formEmail = authForm.value?.state?.email
	resetPasswordEmail.value = typeof formEmail === 'string' ? formEmail : ''
	showResetPasswordModal.value = true
}

const sendResetPasswordEmail = async () => {
	const emailValue = resetPasswordEmail.value
	if (!emailValue || !emailBool(emailValue)) {
		toast.add({ title: 'Email invalido', color: 'warning' })
		return
	}

	const resetPasswordRoute = router.getRoutes().find((route) => route.name === 'ResetPasswordPage')
	if (!resetPasswordRoute) {
		return
	}

	let path = `${process.env.VUE_ROUTER_BASE || ''}${resetPasswordRoute.path}`
	path = path.replace('//', '/')
	await requestPasswordReset({ email: emailValue, reset_url: window.location.origin + path })
	showResetPasswordModal.value = false
	toast.add({
		title: 'Revisa tu email',
		description: 'Recibiras las instrucciones para cambiar tu contrasena.',
		color: 'primary'
	})
}

const login = async (event: FormSubmitEvent<LoginFormState>) => {
	if (!event.data.email || !event.data.password) {
		toast.add({ title: 'Completa email y contrasena', color: 'warning' })
		return
	}

	try {
		await loginDirectus({
			email: event.data.email,
			password: event.data.password
		})

		songStore.user = (await useDirectusUser()).value
		posthog.identify(songStore.user?.id, { email: songStore.user?.email })
		await navigateTo({ name: 'Canvas' })
	} catch {
		toast.add({ title: 'Error al iniciar sesion', color: 'error' })
	}
}
</script>
