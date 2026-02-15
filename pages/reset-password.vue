<template>
	<div class="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4">
		<UPageCard class="w-full">
			<UAuthForm
				title="Resetea tu contrasena"
				description="Introduce una nueva contrasena para tu cuenta."
				icon="i-lucide-key-round"
				:fields="fields"
				:submit="{ label: 'Resetear contrasena', color: 'primary', block: true }"
				@submit="resetAccountPassword"
			/>
		</UPageCard>
	</div>
</template>

<script lang="ts" setup>
import { useRoute } from 'vue-router'
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
	name: 'ResetPasswordPage'
})

const route = useRoute()
const { resetPassword } = useDirectusAuth()
const toast = useToast()

const fields: AuthFormField[] = [
	{ name: 'password', type: 'password', label: 'Contrasena', required: true, placeholder: 'Nueva contrasena' }
]

interface ResetPasswordFormState {
	password: string
}

const resetAccountPassword = async (event: FormSubmitEvent<ResetPasswordFormState>) => {
	if (!event.data.password) {
		toast.add({ title: 'La contrasena es obligatoria', color: 'warning' })
		return
	}

	try {
		if (!route.query.token || typeof route.query.token !== 'string') {
			await navigateTo({ name: 'Home' })
			return
		}

		await resetPassword({ token: route.query.token, password: event.data.password })
		await navigateTo({ name: 'LoginPage' })
	} catch {
		toast.add({ title: 'Error al resetear la contrasena', color: 'error' })
	}
}
</script>
