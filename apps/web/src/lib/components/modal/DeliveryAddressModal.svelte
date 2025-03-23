<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { buttonVariants } from '../ui/button';
	import { Loader2, Plus } from 'lucide-svelte';
	import * as Form from '$lib/components/ui/form';
	import Button from '../ui/button/button.svelte';
	import ResponsiveDialog from '../ResponsiveDialog.svelte';
	import { addAddressModalState, deliveryAddressModalState } from '$lib/states/modalState.svelte';
	import { client } from '$lib/hc';
	import { toast } from 'svelte-sonner';
	import * as RadioGroup from '$lib/components/ui/radio-group';

	type Props = {
		onAddressSelect: (addressId: string) => void;
	};
	let { onAddressSelect }: Props = $props(); // Cleaned up spacing

	let addresses = $state<
		Array<{
			id: string;
			address: string;
			latitude: number;
			longitude: number;
			isDefault: boolean;
		}>
	>([]);
	let selectedAddressId = $state<string | undefined>(undefined);
	let isLoading = $state(false);

	async function loadAddresses() {
		try {
			isLoading = true;
			const res = await client.address.$get();
			if (res.ok) {
				const data = await res.json();
				addresses = data.data;
				// Select default address if exists
				const defaultAddress = data.data.find((addr) => addr.isDefault);
				if (defaultAddress) {
					selectedAddressId = defaultAddress.id;
				}
			}
		} catch (error) {
			toast.error('Failed to load addresses');
		} finally {
			isLoading = false;
		}
	}

	function handleAddAddress() {
		deliveryAddressModalState.setFalse();
		addAddressModalState.setTrue();
	}

	function handleSelectAddress() {
		if (!selectedAddressId) {
			toast.error('Please select an address');
			return;
		}
		onAddressSelect(selectedAddressId);
	}

	$effect(() => {
		if (addAddressModalState.value === false) {
			// Reload addresses when AddAddressModal is closed
			loadAddresses();
		}
	});
</script>

<ResponsiveDialog title="Choose Delivery Address" bind:open={deliveryAddressModalState.value}>
	<div class="space-y-4">
		{#if isLoading}
			<div class="flex justify-center py-4">
				<Loader2 class="h-6 w-6 animate-spin" />
			</div>
		{:else if addresses.length === 0}
			<div class="py-4 text-center">
				<p class="text-muted-foreground">No addresses found. Add a new address to continue.</p>
			</div>
		{:else}
			<RadioGroup.Root bind:value={selectedAddressId} class="space-y-2">
				{#each addresses as address}
					<div class="flex items-center space-x-2 rounded-lg border p-4">
						<RadioGroup.Item value={address.id} id={address.id} />

						<label for={address.id} class="flex-grow cursor-pointer">
							<div class="font-medium">{address.address}</div>
							{#if address.isDefault}
								<span class="text-sm text-muted-foreground">Default address</span>
							{/if}
						</label>
					</div>
				{/each}
			</RadioGroup.Root>
		{/if}

		<div class="flex flex-col gap-2 pt-4">
			<Button
				type="button"
				onclick={handleSelectAddress}
				class="w-full"
				disabled={!selectedAddressId}
			>
				Choose Address
			</Button>
			<Button type="button" variant="outline" onclick={handleAddAddress} class="w-full">
				<Plus class="mr-2 h-4 w-4" />
				Add New Address
			</Button>
		</div>
	</div>
</ResponsiveDialog>
