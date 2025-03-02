<script lang="ts">
	import { adminState } from '$lib/states/adminState.svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Form from '$lib/components/ui/form';
	import { ArrowLeft } from 'lucide-svelte';

	let formData = {
		name: '',
		email: '',
		phone: '',
		address: '',
		preferences: {
			notifications: {
				email: true,
				sms: true,
				push: true
			},
			dietary: []
		}
	};

	function handleSubmit() {
		// In real app, call adminState.createCustomer
		console.log('Creating customer:', formData);
	}
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<div class="space-y-1">
			<h2 class="text-2xl font-bold">Add New Customer</h2>
			<p class="text-muted-foreground">Create a new customer account manually</p>
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
						<Input
							id="name"
							bind:value={formData.name}
							placeholder="Enter customer's name"
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
							placeholder="Enter delivery address"
							required
						/>
					</div>
				</div>
			</div>
		</Card>

		<!-- Preferences -->
		<Card class="p-6">
			<h3 class="mb-6 font-semibold">Preferences</h3>
			<div class="grid gap-6">
				<div class="space-y-4">
					<Label>Notification Preferences</Label>
					<div class="grid gap-4 sm:grid-cols-3">
						<div class="flex items-center gap-2">
							<input
								type="checkbox"
								id="emailNotif"
								bind:checked={formData.preferences.notifications.email}
							/>
							<Label for="emailNotif">Email Notifications</Label>
						</div>
						<div class="flex items-center gap-2">
							<input
								type="checkbox"
								id="smsNotif"
								bind:checked={formData.preferences.notifications.sms}
							/>
							<Label for="smsNotif">SMS Notifications</Label>
						</div>
						<div class="flex items-center gap-2">
							<input
								type="checkbox"
								id="pushNotif"
								bind:checked={formData.preferences.notifications.push}
							/>
							<Label for="pushNotif">Push Notifications</Label>
						</div>
					</div>
				</div>

				<div class="space-y-4">
					<Label>Dietary Preferences</Label>
					<div class="grid gap-4 sm:grid-cols-3">
						{#each ['Halal', 'Vegetarian', 'Vegan', 'Gluten Free', 'Dairy Free', 'Nut Free'] as pref}
							<div class="flex items-center gap-2">
								<input
									type="checkbox"
									id={pref.toLowerCase().replace(' ', '-')}
									on:change={(e) => {
										if (e.currentTarget.checked) {
											formData.preferences.dietary = [...formData.preferences.dietary, pref];
										} else {
											formData.preferences.dietary = formData.preferences.dietary.filter(
												(p) => p !== pref
											);
										}
									}}
								/>
								<Label for={pref.toLowerCase().replace(' ', '-')}>{pref}</Label>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</Card>

		<div class="flex justify-end gap-4">
			<Button type="button" variant="outline" onclick={() => history.back()}>Cancel</Button>
			<Button type="submit">Create Customer</Button>
		</div>
	</form>
</div>
