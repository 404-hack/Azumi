<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';

	type StoreOperation = {
		storeName: string;
		description: string;
		openingHours: string;
		closingHours: string;
		contactPhone: string;
		storeAddress: string;
	};

	let formData = $state<StoreOperation>({
		storeName: '',
		description: '',
		openingHours: '',
		closingHours: '',
		contactPhone: '',
		storeAddress: ''
	});

	function handleSubmit() {
		// Handle form submission logic will be implemented later
		console.log('Form submitted:', formData);
	}
</script>

<form class="mx-auto w-full max-w-2xl space-y-6 p-6" on:submit|preventDefault={handleSubmit}>
	<div class="space-y-2">
		<Label for="storeName">Store Name</Label>
		<Input
			id="storeName"
			type="text"
			placeholder="Enter store name"
			bind:value={formData.storeName}
			required
		/>
	</div>

	<div class="space-y-2">
		<Label for="description">Store Description</Label>
		<Textarea
			id="description"
			placeholder="Enter store description"
			bind:value={formData.description}
			required
		/>
	</div>

	<div class="grid grid-cols-2 gap-4">
		<div class="space-y-2">
			<Label for="openingHours">Opening Hours</Label>
			<Input id="openingHours" type="time" bind:value={formData.openingHours} required />
		</div>

		<div class="space-y-2">
			<Label for="closingHours">Closing Hours</Label>
			<Input id="closingHours" type="time" bind:value={formData.closingHours} required />
		</div>
	</div>

	<div class="space-y-2">
		<Label for="contactPhone">Contact Phone</Label>
		<Input
			id="contactPhone"
			type="tel"
			placeholder="Enter contact phone number"
			bind:value={formData.contactPhone}
			required
		/>
	</div>

	<div class="space-y-2">
		<Label for="storeAddress">Store Address</Label>
		<Textarea
			id="storeAddress"
			placeholder="Enter store address"
			bind:value={formData.storeAddress}
			required
		/>
	</div>

	<Button type="submit" class="w-full">Save Store Operation Details</Button>
</form>
