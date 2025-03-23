<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { buttonVariants } from '../ui/button';
	import { Loader2, MapPin } from 'lucide-svelte';
	import { defaults, superForm, type Infer } from 'sveltekit-superforms/client';
	import { zod } from 'sveltekit-superforms/adapters';
	import Input from '../ui/input/input.svelte';
	import * as Form from '$lib/components/ui/form';
	import Button from '../ui/button/button.svelte';
	import ResponsiveDialog from '../ResponsiveDialog.svelte';
	import { addAddressModalState } from '$lib/states/modalState.svelte';
	import PlacesInput from '$lib/components/ui/places-input/places-input.svelte';
	import { addressSchema } from '@repo/server/validations';
	import { client } from '$lib/hc';
	import { toast } from 'svelte-sonner';
	import { getCurrentPosition, reverseGeocode } from '$lib/utils/geolocation';
	import type { Place } from '$lib/types/places';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	let isGettingLocation = $state(false);

	const form = superForm(defaults(zod(addressSchema)), {
		validators: zod(addressSchema),
		SPA: true,
		resetForm: false,
		dataType: 'json',
		onUpdate: async ({ form }) => {
			console.log('🚀 ~ onUpdate: ~ form:', form.data);
			if (form.valid) {
				if (form.data.longitude === 0 && form.errors.latitude === 0) {
					toast.error('Please select a location from the suggestions.');
					return;
				}

				const res = await client.address.$post({
					json: {
						...form.data
					}
				});
				if (res.ok) {
					toast.success('Address added successfully');
					addAddressModalState.setFalse();
				} else {
					toast.error('An error occurred while adding your address. Please try again later.');
				}
			}
		}
	});
	const { form: formData, enhance, delayed, capture, restore, submit } = form;

	// Initialize isDefault value
	$formData.isDefault = false;

	function handlePlaceSelect(place: Place) {
		if (place) {
			$formData.longitude = place.lng;
			$formData.latitude = place.lat;
			$formData.address = place.address;
		}
	}

	async function useCurrentLocation() {
		try {
			isGettingLocation = true;
			const position = await getCurrentPosition();
			const { latitude, longitude } = position.coords;

			const address = await reverseGeocode(latitude, longitude);
			$formData.address = address;
			$formData.longitude = longitude;
			$formData.latitude = latitude;
			toast.success('Location obtained successfully');
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to get location';
			toast.error(errorMessage);
		} finally {
			isGettingLocation = false;
		}
	}
</script>

<ResponsiveDialog title="Add Address" bind:open={addAddressModalState.value}>
	<form method="POST" use:enhance>
		<Form.Field {form} name="address">
			<Form.Control>
				{#snippet children({ props })}
					<div class="relative space-y-2">
						<Form.Label>Address</Form.Label>
						<PlacesInput
							{...props}
							bind:value={$formData.address}
							onPlaceSelect={handlePlaceSelect}
						/>
						<Form.Description>
							Start typing to see address suggestions for locations across Nigeria.
						</Form.Description>
					</div>

					<Button
						type="button"
						variant="outline"
						onclick={() => useCurrentLocation()}
						class="mt-2 w-full"
						disabled={isGettingLocation}
					>
						{#if isGettingLocation}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							Getting location...
						{:else}
							<MapPin class="mr-2 h-4 w-4" />
							Use Current Location
						{/if}
					</Button>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="isDefault">
			<Form.Control>
				{#snippet children({ props })}
					<Checkbox {...props} bind:checked={$formData.isDefault} />
					<Form.Label>Set as my default address</Form.Label>
				{/snippet}
			</Form.Control>
		</Form.Field>

		<Button type="submit" class="mt-3 w-full shadow-md" size="lg">Add address</Button>
	</form>
</ResponsiveDialog>
