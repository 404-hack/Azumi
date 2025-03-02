<script lang="ts">
	import { adminState } from '$lib/states/adminState.svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Form from '$lib/components/ui/form';
	import { Store, ArrowLeft } from 'lucide-svelte';

	let formData = {
		businessName: '',
		ownerName: '',
		email: '',
		phone: '',
		address: '',
		description: '',
		category: '',
		bankName: '',
		accountNumber: '',
		accountName: ''
	};

	function handleSubmit() {
		// In real app, call adminState.createVendor
		console.log('Creating vendor:', formData);
	}
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<div class="space-y-1">
			<h2 class="text-2xl font-bold">Add New Vendor</h2>
			<p class="text-muted-foreground">Create a new vendor account manually</p>
		</div>
		<Button variant="outline" onclick={() => history.back()}>
			<ArrowLeft class="mr-2 h-4 w-4" />
			Back
		</Button>
	</div>

	<form on:submit|preventDefault={handleSubmit} class="space-y-6">
		<!-- Business Information -->
		<Card class="p-6">
			<h3 class="mb-6 font-semibold">Business Information</h3>
			<div class="grid gap-6">
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label for="businessName">Business Name</Label>
						<Input
							id="businessName"
							bind:value={formData.businessName}
							placeholder="Enter business name"
							required
						/>
					</div>
					<div class="space-y-2">
						<Label for="category">Category</Label>
						<Input
							id="category"
							bind:value={formData.category}
							placeholder="e.g. Restaurant, Grocery"
							required
						/>
					</div>
				</div>

				<div class="space-y-2">
					<Label for="description">Business Description</Label>
					<Textarea
						id="description"
						bind:value={formData.description}
						placeholder="Enter business description"
						required
					/>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label for="ownerName">Owner Name</Label>
						<Input
							id="ownerName"
							bind:value={formData.ownerName}
							placeholder="Enter owner's name"
							required
						/>
					</div>
					<div class="space-y-2">
						<Label for="email">Email</Label>
						<Input
							id="email"
							type="email"
							bind:value={formData.email}
							placeholder="Enter email address"
							required
						/>
					</div>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label for="phone">Phone Number</Label>
						<Input
							id="phone"
							type="tel"
							bind:value={formData.phone}
							placeholder="Enter phone number"
							required
						/>
					</div>
					<div class="space-y-2">
						<Label for="address">Address</Label>
						<Input
							id="address"
							bind:value={formData.address}
							placeholder="Enter business address"
							required
						/>
					</div>
				</div>
			</div>
		</Card>

		<!-- Banking Information -->
		<Card class="p-6">
			<h3 class="mb-6 font-semibold">Banking Information</h3>
			<div class="grid gap-6">
				<div class="space-y-2">
					<Label for="bankName">Bank Name</Label>
					<Input
						id="bankName"
						bind:value={formData.bankName}
						placeholder="Enter bank name"
						required
					/>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label for="accountNumber">Account Number</Label>
						<Input
							id="accountNumber"
							bind:value={formData.accountNumber}
							placeholder="Enter account number"
							required
						/>
					</div>
					<div class="space-y-2">
						<Label for="accountName">Account Name</Label>
						<Input
							id="accountName"
							bind:value={formData.accountName}
							placeholder="Enter account name"
							required
						/>
					</div>
				</div>
			</div>
		</Card>

		<div class="flex justify-end gap-4">
			<Button type="button" variant="outline" onclick={() => history.back()}>Cancel</Button>
			<Button type="submit">Create Vendor</Button>
		</div>
	</form>
</div>
