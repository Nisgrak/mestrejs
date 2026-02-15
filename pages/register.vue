<template>
	<div class="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4">
		<UPageCard class="w-full">
			<UAuthForm
				title="Crea tu cuenta"
				description="Registrate para guardar y sincronizar tus partituras."
				icon="i-lucide-user-plus"
				:fields="fields"
				:submit="{ label: 'Crear cuenta', color: 'primary', block: true }"
				@submit="register"
			/>
		</UPageCard>
	</div>
</template>

<script lang="ts" setup>
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
	name: 'RegisterPage'
})

const songStore = useSongStore()
const { createUser, login } = useDirectusAuth()
const toast = useToast()

const fields: AuthFormField[] = [
	{ name: 'email', type: 'email', label: 'Email', required: true, placeholder: 'tu@email.com' },
	{ name: 'password', type: 'password', label: 'Contrasena', required: true, placeholder: 'Minimo 8 caracteres' }
]

interface RegisterFormState {
	email: string
	password: string
}

const register = async (event: FormSubmitEvent<RegisterFormState>) => {
	if (!event.data.email || !event.data.password) {
		toast.add({ title: 'Completa email y contrasena', color: 'warning' })
		return
	}

	try {
		await createUser({ email: event.data.email, password: event.data.password })
		await login({ email: event.data.email, password: event.data.password })
		songStore.user = (await useDirectusUser()).value
		await navigateTo({ name: 'Canvas' })
	} catch {
		toast.add({ title: 'Error al crear la cuenta', color: 'error' })
	}
}
</script>
