<script lang="ts">
	import { adminState } from '$lib/states/adminState.svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Form from '$lib/components/ui/form';
	import * as Select from '$lib/components/ui/select';
	import { ArrowLeft } from 'lucide-svelte';

	let formData = {
		name: '',
		email: '',
		phone: '',
		address: '',
		vehicleType: '',
		vehicleDetails: {
			make: '',
			model: '',
			year: '',
			color: '',
			plateNumber: ''
		},
		bankInfo: {
			bankName: '',
			accountNumber: '',
			accountName: ''
		}
	};

	function handleSubmit() {
		// In real app, call adminState.createRider
		console.log('Creating rider:', formData);
	}
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<div class="space-y-1">
			<h2 class="text-2xl font-bold">Add New Rider</h2>
			<p class="text-muted-foreground">Create a new rider account manually</p>
		</div>
		<Button variant="outline" onclick={() => history.back()}>
			<ArrowLeft class="mr-2 h-4 w-4" />
			Back
		</Button>
	</div>

	<form on:submit|preventDefault={handleSubmit} class="space-y-6">
		<!-- Personal Information -->
		<Card class="p-6">
			<h3 class="mb-6 font-semibold">Personal Information</h3>
			<div class="grid gap-6">
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label for="name">Full Name</Label>
						<Input id="name" bind:value={formData.name} placeholder="Enter rider's name" required />
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
							placeholder="Enter address"
							required
						/>
					</div>
				</div>
			</div>
		</Card>

		<!-- Vehicle Information -->
		<Card class="p-6">
			<h3 class="mb-6 font-semibold">Vehicle Information</h3>
			<div class="grid gap-6">
				<div class="space-y-2">
					<Label for="vehicleType">Vehicle Type</Label>
					<Select.Root bind:value={formData.vehicleType}>
						<Select.Trigger class="w-full">
							<Select.Value placeholder="Select vehicle type" />
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="motorcycle">Motorcycle</Select.Item>
							<Select.Item value="bicycle">Bicycle</Select.Item>
							<Select.Item value="car">Car</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label for="make">Make</Label>
						<Input
							id="make"
							bind:value={formData.vehicleDetails.make}
							placeholder="Enter vehicle make"
							required
						/>
					</div>
					<div class="space-y-2">
						<Label for="model">Model</Label>
						<Input
							id="model"
							bind:value={formData.vehicleDetails.model}
							placeholder="Enter vehicle model"
							required
						/>
					</div>
				</div>

				<div class="grid gap-4 sm:grid-cols-3">
					<div class="space-y-2">
						<Label for="year">Year</Label>
						<Input
							id="year"
							bind:value={formData.vehicleDetails.year}
							placeholder="Enter vehicle year"
							required
						/>
					</div>
					<div class="space-y-2">
						<Label for="color">Color</Label>
						<Input
							id="color"
							bind:value={formData.vehicleDetails.color}
							placeholder="Enter vehicle color"
							required
						/>
					</div>
					<div class="space-y-2">
						<Label for="plateNumber">Plate Number</Label>
						<Input
							id="plateNumber"
							bind:value={formData.vehicleDetails.plateNumber}
							placeholder="Enter plate number"
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
						bind:value={formData.bankInfo.bankName}
						placeholder="Enter bank name"
						required
					/>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label for="accountNumber">Account Number</Label>
						<Input
							id="accountNumber"
							bind:value={formData.bankInfo.accountNumber}
							placeholder="Enter account number"
							required
						/>
					</div>
					<div class="space-y-2">
						<Label for="accountName">Account Name</Label>
						<Input
							id="accountName"
							bind:value={formData.bankInfo.accountName}
							placeholder="Enter account name"
							required
						/>
					</div>
				</div>
			</div>
		</Card>

		<div class="flex justify-end gap-4">
			<Button type="button" variant="outline" onclick={() => history.back()}>Cancel</Button>
			<Button type="submit">Create Rider</Button>
		</div>
	</form>
</div>
