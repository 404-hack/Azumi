<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Plus } from 'lucide-svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogFooter
	} from '$lib/components/ui/dialog';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { addAddressModalState } from '$lib/states/modalState.svelte';
	import AddAddressModal from '$lib/components/modal/AddAddressModal.svelte';
	import { client } from '$lib/hc';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	interface Address {
		id: string;
		address: string;
		latitude: number | string;
		longitude: number | string;
		isDefault: boolean;
	}

	let showModal = $state(false);
	let currentEditId = $state<string | null>(null);
	let formData = $state({
		address: '',
		latitude: 0,
		longitude: 0,
		isDefault: false
	});

	// Loading state for address actions
	let loadingId = $state<string | null>(null);

	function handleAddAddress() {
		addAddressModalState.setTrue();
	}

	async function setAsDefault(addressId: string) {
		try {
			loadingId = addressId;

			const response = await client.address[':id']['set-default'].$post({
				param: { id: addressId }
			});

			if (response.ok) {
				toast.success('Default address updated');
				// Refresh the data to reflect the changes
				await invalidateAll();
			} else {
				toast.error('Failed to update default address');
			}
		} catch (error) {
			toast.error('An error occurred. Please try again.');
			console.error('Error setting default address:', error);
		} finally {
			loadingId = null;
		}
	}

	async function deleteAddress(addressId: string) {
		try {
			loadingId = addressId;

			const response = await client.address[':id'].$delete({
				param: { id: addressId }
			});

			if (response.ok) {
				toast.success('Address deleted successfully');
				// Refresh the data to reflect the changes
				await invalidateAll();
			} else {
				toast.error('Failed to delete address');
			}
		} catch (error) {
			toast.error('An error occurred. Please try again.');
			console.error('Error deleting address:', error);
		} finally {
			loadingId = null;
		}
	}
</script>

<AddAddressModal />
<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-semibold">My Addresses</h2>
		<Button onclick={handleAddAddress} variant="outline" class="flex items-center gap-2">
			<Plus class="h-4 w-4" />
			Add New Address
		</Button>
	</div>

	{#if data.addresses.length === 0}
		<div class="flex h-40 items-center justify-center rounded-lg border-2 border-dashed">
			<p class="text-muted-foreground">No addresses saved yet</p>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2">
			{#each data.addresses as address (address.id)}
				<Card class="overflow-hidden">
					<div class="p-4">
						<div class="flex items-center justify-between">
							{#if address.isDefault}
								<span
									class="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="mr-1 h-3 w-3"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg
									>
									Default Address
								</span>
							{:else}
								<span
									class="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
								>
									Delivery Address
								</span>
							{/if}

							<div class="flex space-x-1">
								<Button
									variant="ghost"
									size="sm"
									class="h-8 w-8 rounded-full p-0 text-red-500 hover:bg-red-50"
									onclick={() => deleteAddress(address.id)}
									disabled={loadingId === address.id}
								>
									<span class="sr-only">Delete</span>
									{#if loadingId === address.id}
										<svg
											class="h-4 w-4 animate-spin"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												class="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												stroke-width="4"
											></circle>
											<path
												class="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
									{:else}
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="16"
											height="16"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
											><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path
												d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
											/><line x1="10" x2="10" y1="11" y2="17" /><line
												x1="14"
												x2="14"
												y1="11"
												y2="17"
											/></svg
										>
									{/if}
								</Button>
							</div>
						</div>

						<div class="mt-3">
							<div class="flex items-start">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="mr-2 mt-1 h-5 w-5 text-gray-500"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle
										cx="12"
										cy="10"
										r="3"
									/></svg
								>
								<p class="text-base leading-relaxed">{address.address}</p>
							</div>
						</div>
					</div>

					<div class="flex border-t">
						<button
							class="flex w-full items-center justify-center py-3 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-50"
							onclick={() => setAsDefault(address.id)}
							disabled={address.isDefault || loadingId === address.id}
						>
							{#if loadingId === address.id}
								<svg
									class="mr-2 h-4 w-4 animate-spin"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								Processing...
							{:else if !address.isDefault}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="mr-2 h-4 w-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									><path d="m12 15 2 2 4-4" /><rect
										width="18"
										height="18"
										x="3"
										y="3"
										rx="2"
									/></svg
								>
								Set as Default
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="mr-2 h-4 w-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									><path d="M12 2v20" /><path
										d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
									/></svg
								>
								Default Address
							{/if}
						</button>
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>
