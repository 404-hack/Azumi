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
	import { addDeliveryAddressModalState } from '$lib/states/modalState.svelte';
	import PlacesInput from '$lib/components/ui/places-input/places-input.svelte';
	import { addressSchema } from '@repo/server/validations';
	import { client } from '$lib/hc';
	import { toast } from 'svelte-sonner';
	import { getCurrentPosition, reverseGeocode } from '$lib/utils/geolocation';
	import type { Place } from '$lib/types/places';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import type { TAddress } from '@repo/server/types';
	import { onMount } from 'svelte';
	import { activeLocation } from '$lib/states/locationState.svelte';
	// import * as Menubar from '$lib/components/ui/menubar/index.js';
	let isGettingLocation = $state(false);

	// Initialize isDefault value

	function handlePlaceSelect(place: Place) {
		if (place) {
			activeLocation.current = {
				name: place.name,
				address: place.address,
				lat: place.lat,
				lng: place.lng
			};
		}
	}

	async function useCurrentLocation() {
		try {
			isGettingLocation = true;
			const position = await getCurrentPosition();
			const { latitude, longitude } = position.coords;

			const { address, name } = await reverseGeocode(latitude, longitude);
			activeLocation.current = {
				name,
				address,
				lat: latitude,
				lng: longitude
			};
			// $formData.address = address;
			// $formData.longitude = longitude;
			// $formData.latitude = latitude;
			toast.success('Location obtained successfully');
			addDeliveryAddressModalState.setFalse();
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to get location';
			toast.error(errorMessage);
		} finally {
			isGettingLocation = false;
		}
	}

	let addresses: TAddress[] = $state([]);
	async function loadAddresses() {
		try {
			const res = await client.address.$get();
			if (res.ok) {
				const data = await res.json();
				addresses = data.data;
				// Select default address if exists
				const defaultAddress = data.data.find((addr) => addr.isDefault);
			}
		} catch (error) {
			toast.error('Failed to load addresses');
		}
	}
	onMount(() => {
		loadAddresses();
	});
</script>

<ResponsiveDialog title="Delivery Address" bind:open={addDeliveryAddressModalState.value}>
	<form>
		<div class="relative mt-3 space-y-2">
			<!-- bind:value={$formData.address} -->
			<PlacesInput onPlaceSelect={handlePlaceSelect} />
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
				<MapPin class="mr-2 h-4 w-4 text-primary" />
				Use Current Location
			{/if}
		</Button>

		<ScrollArea class="max-h-[100px] w-full ">
			<div class="space-y-4">
				{#each addresses as address}
					<label
						for={address.id}
						class="flex flex-grow cursor-pointer items-center gap-2 rounded p-2 text-xs hover:bg-muted"
						onclick={() => {
							console.log(address);
							activeLocation.current = {
								name: address.address,
								address: address.address,
								lat: address.latitude,
								lng: address.longitude
							};
							addDeliveryAddressModalState.setFalse();
						}}
					>
						<MapPin class="h-4 w-4 text-primary" />
						<div>{address.address}</div>
					</label>
				{/each}
			</div>
		</ScrollArea>
	</form>
</ResponsiveDialog>
