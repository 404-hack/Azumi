<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import * as Select from '$lib/components/ui/select';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Bike,
		MapPin,
		Moon,
		Languages,
		LogOut,
		UserCog,
		Wallet,
		ListTodo,
		Loader2
	} from 'lucide-svelte';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { updateRiderProfileSchema } from '@repo/server/validations';
	import { client } from '$lib/hc';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import RiderTodoList from '$lib/components/rider/RiderTodoList.svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();

	const VEHICLE_TYPES = ['BICYCLE', 'MOTORCYCLE', 'CAR'] as const;

	const form = superForm(
		defaults(
			{
				firstName: data.profile?.firstName || '',
				lastName: data.profile?.lastName || '',
				email: data.profile?.email || '',
				address: data.profile?.address || '',
				addressName: data.profile?.addressName || '',
				vehicleType: data.profile?.vehicleType || 'BICYCLE',
				vehicleLicense: data.profile?.vehicleLicense || '',
				maxDeliveryDistance: data.profile?.maxDeliveryDistance || 10
			},
			zod(updateRiderProfileSchema)
		),
		{
			validators: zod(updateRiderProfileSchema),
			SPA: true,
			resetForm: false,
			dataType: 'json',
			onUpdated: async ({ form }) => {
				if (form.valid) {
					const res = await client.rider.profile.$patch({
						json: {
							...form.data
						}
					});

					if (res.ok) {
						toast.success('Profile updated successfully');
						await invalidateAll();
					} else {
						toast.error('Failed to update profile');
					}
				}
			},
			onError: ({ result }) => {
				console.error('Form submission error:', result.error);
				toast.error('Failed to update profile');
			}
		}
	);

	const { form: formData, delayed, submitting, enhance, errors } = form;

	const languages = [
		{ value: 'en', label: 'English' },
		{ value: 'fr', label: 'French' },
		{ value: 'es', label: 'Spanish' },
		{ value: 'ar', label: 'Arabic' }
	];

	const themes = [
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' },
		{ value: 'system', label: 'System' }
	];

	let settings = $state({
		appearance: {
			theme: 'system',
			language: 'en'
		}
	});
	async function requestVerification() {
		try {
			const response = await client.rider['request-verification'].$post();

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					'error' in errorData
						? errorData.error
						: errorData.message || 'Failed to request verification'
				);
			}

			const result = await response.json();
			toast.success(result.message || 'Verification request sent successfully!');
			await invalidateAll();
		} catch (error: any) {
			console.error('Error requesting verification:', error);
			toast.error(error.message || 'Failed to request verification');
		}
	}
</script>

<div class="space-y-8">
	<div>
		<h2 class="text-2xl font-bold">Rider Settings</h2>
		<p class="text-muted-foreground">Manage your account and delivery preferences</p>
	</div>

	<!-- Todo Section -->
	{#if data.todos}
		<Card class="p-6">
			<div class="mb-6 flex items-center gap-2">
				<ListTodo class="h-5 w-5" />
				<h3 class="font-semibold">Complete Your Profile</h3>
			</div>
			<RiderTodoList todos={data.todos} onVerificationRequest={requestVerification} />
		</Card>
	{/if}

	<form method="POST" use:enhance class="space-y-6">
		<!-- Personal Information -->
		<Card class="p-6">
			<div class="mb-6 flex items-center gap-2">
				<UserCog class="h-5 w-5" />
				<h3 class="font-semibold">Personal Information</h3>
			</div>
			<div class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<Label for="firstName">First Name</Label>
						<Input
							id="firstName"
							type="text"
							bind:value={$formData.firstName}
							placeholder="Enter your first name"
						/>
						{#if $errors.firstName}
							<p class="text-sm text-destructive">{$errors.firstName[0]}</p>
						{/if}
					</div>
					<div>
						<Label for="lastName">Last Name</Label>
						<Input
							id="lastName"
							type="text"
							bind:value={$formData.lastName}
							placeholder="Enter your last name"
						/>
						{#if $errors.lastName}
							<p class="text-sm text-destructive">{$errors.lastName[0]}</p>
						{/if}
					</div>
				</div>
				<div>
					<Label for="email">Email Address</Label>
					<Input
						id="email"
						type="email"
						bind:value={$formData.email}
						placeholder="Enter your email address"
					/>
					{#if $errors.email}
						<p class="text-sm text-destructive">{$errors.email[0]}</p>
					{/if}
				</div>
				<div>
					<Label for="address">Address</Label>
					<Input
						id="address"
						type="text"
						bind:value={$formData.address}
						placeholder="Enter your address"
					/>
					{#if $errors.address}
						<p class="text-sm text-destructive">{$errors.address[0]}</p>
					{/if}
				</div>
			</div>
		</Card>

		<!-- Vehicle Settings -->
		<Card class="p-6">
			<div class="mb-6 flex items-center gap-2">
				<Bike class="h-5 w-5" />
				<h3 class="font-semibold">Vehicle Information</h3>
			</div>
			<div class="space-y-4">
				<div>
					<Label for="vehicleType">Vehicle Type</Label>
					<Select.Root
						selected={{ value: $formData.vehicleType, label: $formData.vehicleType?.toLowerCase() }}
						onSelectedChange={(v) => {
							if (v) {
								$formData.vehicleType = v.value;
							}
						}}
					>
						<Select.Trigger class="w-full">
							<Select.Value placeholder="Select vehicle type" />
						</Select.Trigger>
						<Select.Content>
							{#each VEHICLE_TYPES as type}
								<Select.Item value={type}>{type.toLowerCase()}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#if $errors.vehicleType}
						<p class="text-sm text-destructive">{$errors.vehicleType[0]}</p>
					{/if}
				</div>
				<div>
					<Label for="vehicleLicense">Vehicle License</Label>
					<Input
						id="vehicleLicense"
						type="text"
						bind:value={$formData.vehicleLicense}
						placeholder="Enter vehicle license number"
					/>
					{#if $errors.vehicleLicense}
						<p class="text-sm text-destructive">{$errors.vehicleLicense[0]}</p>
					{/if}
				</div>
			</div>
		</Card>

		<!-- Delivery Preferences -->
		<Card class="p-6">
			<div class="mb-6 flex items-center gap-2">
				<MapPin class="h-5 w-5" />
				<h3 class="font-semibold">Delivery Preferences</h3>
			</div>
			<div class="space-y-4">
				<div>
					<Label for="maxDeliveryDistance">Maximum Delivery Distance</Label>
					<div class="flex items-center gap-2">
						<Input
							id="maxDeliveryDistance"
							type="number"
							bind:value={$formData.maxDeliveryDistance}
							min="1"
							max="50"
						/>
						<span class="text-sm text-muted-foreground">km</span>
					</div>
					{#if $errors.maxDeliveryDistance}
						<p class="text-sm text-destructive">{$errors.maxDeliveryDistance[0]}</p>
					{/if}
				</div>
			</div>
		</Card>

		<!-- Payment Information -->
		<Card class="p-6">
			<div class="mb-6 flex items-center gap-2">
				<Wallet class="h-5 w-5" />
				<h3 class="font-semibold">Payment Information</h3>
			</div>
			<div>
				<p class="mb-4 text-sm text-muted-foreground">
					Manage your bank accounts and payment methods for receiving payments from deliveries.
				</p>
				<Button onclick={() => goto('/rider/banking')} variant="outline" class="w-full sm:w-auto">
					Manage Banking Information
				</Button>
			</div>
		</Card>

		<!-- Appearance -->
		<Card class="p-6">
			<div class="mb-6 flex items-center gap-2">
				<Moon class="h-5 w-5" />
				<h3 class="font-semibold">Appearance</h3>
			</div>
			<div class="space-y-4">
				<div>
					<Label for="theme">Theme</Label>
					<Select.Root
						selected={{ value: settings.appearance.theme, label: settings.appearance.theme }}
						onSelectedChange={(v) => {
							if (v) {
								settings.appearance.theme = v.value;
							}
						}}
					>
						<Select.Trigger class="w-full">
							<Select.Value placeholder="Select theme" />
						</Select.Trigger>
						<Select.Content>
							{#each themes as theme}
								<Select.Item value={theme.value}>{theme.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div>
					<Label for="language">Language</Label>
					<Select.Root
						selected={{
							value: settings.appearance.language,
							label: languages.find((l) => l.value === settings.appearance.language)?.label
						}}
						onSelectedChange={(v) => {
							if (v) {
								settings.appearance.language = v.value;
							}
						}}
					>
						<Select.Trigger class="w-full">
							<Select.Value placeholder="Select language" />
						</Select.Trigger>
						<Select.Content>
							{#each languages as language}
								<Select.Item value={language.value}>{language.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			</div>
		</Card>

		<!-- Save Changes -->
		<div class="flex justify-end gap-4">
			<Button variant="outline" type="button">Cancel</Button>
			<Button type="submit" disabled={$submitting}>
				{#if $submitting}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				{/if}
				Save Changes
			</Button>
		</div>
	</form>

	<!-- Account Actions -->
	<Card class="p-6">
		<div class="flex items-center justify-between">
			<div>
				<h3 class="font-semibold text-destructive">Danger Zone</h3>
				<p class="text-sm text-muted-foreground">Permanently delete your rider account</p>
			</div>
			<Button variant="destructive">
				<LogOut class="mr-2 h-4 w-4" />
				Delete Account
			</Button>
		</div>
	</Card>
</div>
