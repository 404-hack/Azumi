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

	interface Address {
		id: string;
		name: string;
		street: string;
		city: string;
		state: string;
		zipCode: string;
		phone: string;
		isDefault: boolean;
	}

	let addresses = $state<Address[]>([
		{
			id: '1',
			name: 'John Doe',
			street: '123 Main St',
			city: 'New York',
			state: 'NY',
			zipCode: '10001',
			phone: '(555) 123-4567',
			isDefault: true
		},
		{
			id: '2',
			name: 'Jane Smith',
			street: '456 Oak Ave',
			city: 'Los Angeles',
			state: 'CA',
			zipCode: '90001',
			phone: '(555) 987-6543',
			isDefault: false
		}
	]);

	let showModal = $state(false);
	let currentEditId = $state<string | null>(null);
	let formData = $state({
		name: '',
		street: '',
		city: '',
		state: '',
		zipCode: '',
		phone: '',
		isDefault: false
	});

	function handleAddAddress() {
		addAddressModalState.setTrue();
	}

	function handleEditAddress(id: string) {
		currentEditId = id;
		const currentAddress = addresses.find((a) => a.id === id);
		if (currentAddress) {
			formData = { ...currentAddress };
		}
		showModal = true;
	}

	function handleDeleteAddress(id: string) {
		addresses = addresses.filter((address) => address.id !== id);
	}

	function handleSubmit() {
		if (currentEditId) {
			addresses = addresses.map((address) =>
				address.id === currentEditId ? { ...address, ...formData } : address
			);
		} else {
			const newAddress = {
				...formData,
				id: crypto.randomUUID()
			};
			addresses = [...addresses, newAddress];
		}
		showModal = false;
	}

	function handleClose() {
		showModal = false;
		currentEditId = null;
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

	{#if addresses.length === 0}
		<div class="flex h-40 items-center justify-center rounded-lg border-2 border-dashed">
			<p class="text-muted-foreground">No addresses saved yet</p>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2">
			{#each addresses as address (address.id)}
				<Card class="p-4">
					<div class="flex justify-between">
						<div>
							<p class="font-medium">{address.name}</p>
							<p class="text-sm text-muted-foreground">{address.street}</p>
							<p class="text-sm text-muted-foreground">
								{address.city}, {address.state}
								{address.zipCode}
							</p>
							<p class="text-sm text-muted-foreground">{address.phone}</p>
							{#if address.isDefault}
								<span
									class="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
								>
									Default
								</span>
							{/if}
						</div>
						<div class="flex gap-2">
							<Button
								variant="ghost"
								size="sm"
								onclick={() => handleEditAddress(address.id)}
								class="text-sm"
							>
								Edit
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onclick={() => handleDeleteAddress(address.id)}
								class="text-sm text-destructive hover:text-destructive"
							>
								Delete
							</Button>
						</div>
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>

<Dialog open={showModal} onOpenChange={handleClose}>
	<DialogContent class="sm:max-w-[425px]">
		<DialogHeader>
			<DialogTitle>{currentEditId ? 'Edit Address' : 'Add New Address'}</DialogTitle>
		</DialogHeader>
		<form onsubmit|preventDefault={handleSubmit} class="grid gap-4 py-4">
			<div class="grid gap-2">
				<Label for="name">Full Name</Label>
				<Input id="name" bind:value={formData.name} required />
			</div>
			<div class="grid gap-2">
				<Label for="street">Street Address</Label>
				<Input id="street" bind:value={formData.street} required />
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div class="grid gap-2">
					<Label for="city">City</Label>
					<Input id="city" bind:value={formData.city} required />
				</div>
				<div class="grid gap-2">
					<Label for="state">State</Label>
					<Input id="state" bind:value={formData.state} required />
				</div>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div class="grid gap-2">
					<Label for="zipCode">ZIP Code</Label>
					<Input id="zipCode" bind:value={formData.zipCode} required />
				</div>
				<div class="grid gap-2">
					<Label for="phone">Phone Number</Label>
					<Input id="phone" bind:value={formData.phone} required />
				</div>
			</div>
			<div class="flex items-center space-x-2">
				<Checkbox id="isDefault" bind:checked={formData.isDefault} />
				<Label for="isDefault">Set as default address</Label>
			</div>
			<DialogFooter>
				<Button type="button" variant="outline" onclick={handleClose}>Cancel</Button>
				<Button type="submit">{currentEditId ? 'Save Changes' : 'Add Address'}</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
