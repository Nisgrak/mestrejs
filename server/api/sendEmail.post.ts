export default defineEventHandler(async (event) => {
	let body = await readBody(event)

	let config = useRuntimeConfig()

	let response = await $fetch(
		`${config.public.directus.url}/flows/trigger/d529b673-bd0a-4132-bf69-8a8a2d0da802`, {
		method: "POST",
		body,
	})

	if ("code" in (response as any)) {
		return {
			code: (response as any).code as string
		}
	} else {
		return {
			code: "UNKNOWN_ERROR"
		}
	}

})
