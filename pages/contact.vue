<template>
	<div class="mx-auto w-full max-w-3xl px-4 py-8">
		<UPageCard>
			<template #header>
				<div class="space-y-1">
					<h1 class="text-2xl font-semibold">Contacto</h1>
					<p class="text-sm text-slate-600">Comparte dudas, errores o mejoras que te gustaria ver en MestreJS.</p>
				</div>
			</template>

			<div class="space-y-4">
				<UAlert
					v-if="requestStatus !== 'idle'"
					:color="requestStatus === 'success' ? 'success' : 'error'"
					:icon="requestStatus === 'success' ? 'i-lucide-check-circle-2' : 'i-lucide-triangle-alert'"
					:title="requestStatus === 'success' ? 'Mensaje enviado' : 'No se pudo enviar'"
					:description="statusMessage"
				/>

				<form class="space-y-4" @submit.prevent="sendContactMessage">
					<NuxtTurnstile v-model="formData.token" />

					<div class="grid gap-3">
						<UInput v-model="formData.subject" label="Asunto" placeholder="Ej: Problema al guardar partitura" required />
						<UInput v-model="formData.name" label="Nombre" placeholder="Tu nombre" required />
						<UInput v-model="formData.email" type="email" label="Email" placeholder="tu@email.com" required />
						<UTextarea v-model="formData.message" label="Mensaje" placeholder="Cuentanos con detalle" :rows="5" required />
					</div>

					<div class="flex justify-end gap-2">
						<UButton color="neutral" variant="ghost" :disabled="isSubmitting" @click="resetForm">Limpiar</UButton>
						<UButton color="primary" type="submit" :loading="isSubmitting">Enviar mensaje</UButton>
					</div>
				</form>
			</div>
		</UPageCard>
	</div>
</template>

<script lang="ts" setup>
definePageMeta({
	name: 'Contact'
})

const formData = ref({
	message: '',
	subject: '',
	name: '',
	email: '',
	token: ''
})

const isSubmitting = ref(false)
const requestStatus = ref<'idle' | 'success' | 'error'>('idle')
const statusMessage = ref('')

const messages = {
	EMAIL_SENDED: 'Muchas gracias por tus comentarios',
	ERROR_CHECK_CAPTCHA: 'Ha ocurrido un error al verificar el captcha',
	CAPTCHA_DONT_SUCCESS: 'El captcha no se ha verificado correctamente',
	ERROR_SENDING_MAIL: 'Ha ocurrido un error al enviar el email',
	UNKNOWN_ERROR: 'Ha ocurrido algun error al enviar el email'
}

async function sendContactMessage() {
	if (isSubmitting.value) {
		return
	}

	requestStatus.value = 'idle'
	statusMessage.value = ''
	isSubmitting.value = true

	try {
		const response = await $fetch('/api/sendEmail', { method: 'POST', body: formData.value })
		if (response.code === 'EMAIL_SENDED') {
			requestStatus.value = 'success'
			statusMessage.value = messages.EMAIL_SENDED
			resetForm()
		} else {
			requestStatus.value = 'error'
			statusMessage.value = response.code ? messages[response.code as keyof typeof messages] : messages.UNKNOWN_ERROR
		}
	} catch {
		requestStatus.value = 'error'
		statusMessage.value = messages.UNKNOWN_ERROR
	} finally {
		isSubmitting.value = false
	}
}

function resetForm() {
	formData.value = {
		message: '',
		subject: '',
		name: '',
		email: '',
		token: ''
	}
}
</script>
