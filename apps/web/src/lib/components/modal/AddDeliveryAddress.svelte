<script lang="ts">
	import { MapPin } from 'lucide-svelte';
	import Button from '../ui/button/button.svelte';
	import ResponsiveDialog from '../ResponsiveDialog.svelte';
	import { addDeliveryAddressModalState } from '$lib/states/modalState.svelte';
	import { client } from '$lib/hc';
	import { toast } from 'svelte-sonner';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import type { TAddress } from '@repo/server/types';
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { activeLocation } from '$lib/states/locationState.svelte';
	import LocationPicker from '../LocationPicker.svelte';
	import type { LocationResult, LocationError } from '$lib/utils/location';
	function handleLocationSelect(location: LocationResult) {
		console.log('📍 Location selected:', location);

		activeLocation.current = {
			name: location.name,
			address: location.address,
			lat: location.coordinates.latitude,
			lng: location.coordinates.longitude
		};

		invalidateAll();
		toast.success(`Location selected: ${location.name}`);
		addDeliveryAddressModalState.setFalse();
	}

	function handleLocationError(error: LocationError) {
		console.error('❌ Location error:', error);
		toast.error(error.userMessage);
	}
	let addresses: TAddress[] = $state([]);

	async function loadAddresses() {
		try {
			const res = await client.address.$get();
			if (res.ok) {
				const data = await res.json();
				addresses = data.data;
			}
		} catch (error) {
			console.error('Failed to load addresses:', error);
			toast.error('Failed to load saved addresses');
		}
	}

	onMount(() => {
		loadAddresses();
	});
</script>

<ResponsiveDialog title="Delivery Address" bind:open={addDeliveryAddressModalState.value}>
	<div class="space-y-4">
		<LocationPicker
			onLocationSelect={handleLocationSelect}
			onError={handleLocationError}
			locationOptions={{
				enableHighAccuracy: true,
				timeout: 15000,
				preferredSource: 'google'
			}}
			class="w-full"
		/>

		{#if addresses.length > 0}
			<div class="space-y-2">
				<h4 class="text-muted-foreground text-sm font-medium">Saved Addresses</h4>
				<ScrollArea class="max-h-32 w-full">
					<div class="space-y-2">
						{#each addresses as address}
							<button
								type="button"
								onclick={() => handleSavedAddressSelect(address)}
								class="hover:bg-muted focus:bg-muted flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors focus:outline-none"
							>
								<MapPin class="text-primary h-4 w-4 flex-shrink-0" />
								<div class="flex-1 overflow-hidden">
									<div class="truncate font-medium">{address.address}</div>
									{#if address.isDefault}
										<div class="text-primary text-xs">Default address</div>
									{/if}
								</div>
							</button>
						{/each}
					</div>
				</ScrollArea>
			</div>
		{/if}
	</div>
</ResponsiveDialog>
