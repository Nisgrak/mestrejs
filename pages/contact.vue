<template>
	<q-page class="row items-center justify-evenly">
		<div class="border-1 rounded-lg p-5 w-9/10 md:w-5/10">
			<div v-if="emailError !== '' || emailSended" class="flex items-center wrap">
				<h4 class="w-full text-center">{{ emailSended ? "Enviado" : "Error" }}</h4>
				<p class="w-full text-center">{{ emailSended ? messages.EMAIL_SENDED : emailError }}</p>
			</div>
			<q-form @submit="sendContactMessage" class="q-gutter-md" v-else>
				<h4>Contacto</h4>

				<NuxtTurnstile v-model="formData.token" />

				<q-card-section class="grid gap-3">
					<q-input filled v-model="formData.subject" label="Asunto" required />
					<q-input filled v-model="formData.name" label="Nombre" required />

					<q-input type="email" filled v-model="formData.email" label="Email" required />

					<q-input type="textarea" filled v-model="formData.message" label="Mensaje" required />

				</q-card-section>
				<q-separator />

				<q-card-actions align="right">
					<q-btn label="Guardar" type="submit" color="primary" unelevated />
				</q-card-actions>
			</q-form>
		</div>
	</q-page>
</template>

<script lang="ts" setup>

definePageMeta({
	name: "Contact"
})

let formData = ref({
	message: "",
	subject: "",
	name: "",
	email: "",
	token: ""

})

let emailSended = ref(false)
let emailError = ref("")

let messages = {
	EMAIL_SENDED: "Muchas gracias por tus comentarios",

	ERROR_CHECK_CAPTCHA: "Ha ocurrido un error al verificar el captcha",
	CAPTCHA_DONT_SUCCESS: "El captcha no se ha verificado correctamente",
	ERROR_SENDING_MAIL: "Ha ocurrido un error al enviar el email",
	UNKNOWN_ERROR: "Ha ocurrido algún error al enviar el email",
}

async function sendContactMessage() {
	try {

		let response = await $fetch("/api/sendEmail", { method: "POST", body: formData.value })

		if (response.code === "EMAIL_SENDED") {
			emailSended.value = true
		} else {
			emailError.value = response.code ? messages[response.code as keyof typeof messages] : messages.UNKNOWN_ERROR

		}
	} catch (error) {
		emailError.value = messages.UNKNOWN_ERROR

	}

}



</script>

<style></style>
