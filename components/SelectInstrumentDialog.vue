<template>
	<q-dialog
		ref="dialogRef"
		@hide="onDialogHide"
	>
		<q-card class="q-dialog-plugin">
			<div class="border-1 rounded-lg p-5">
				<div class="text-xl mb-5 text-center">
					Selecciona un instrumento:
				</div>
				<div>
					<div class="grid grid-cols-3 gap-5">
						<q-btn
							v-for="(instrument, index) in store.instruments"
							:key="instrument.name"
							unelevated
							outline
							no-caps
							@click="onOKClick(index)"
							:aria-label="`Añadir ${ instrument.name}`"

						>
							{{ instrument.name }}
						</q-btn>
					</div>
				</div>
			</div>
		</q-card>
	</q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'

let store = useSongStore()

const props = defineProps({
	// ...your custom props
})

defineEmits([
	// REQUIRED; need to specify some events that your
	// component will emit through useDialogPluginComponent()
	...useDialogPluginComponent.emits
])

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
// dialogRef      - Vue ref to be applied to QDialog
// onDialogHide   - Function to be used as handler for @hide on QDialog
// onDialogOK     - Function to call to settle dialog with "ok" outcome
//                    example: onDialogOK() - no payload
//                    example: onDialogOK({ /*...*/ }) - with payload
// onDialogCancel - Function to call to settle dialog with "cancel" outcome

// this is part of our example (so not required)
function onOKClick (indexInstrument: number) {
	// on OK, it is REQUIRED to
	// call onDialogOK (with optional payload)
	onDialogOK({
		instrument: indexInstrument
	})
	// or with payload: onDialogOK({ ... })
	// ...and it will also hide the dialog automatically
}
</script>
