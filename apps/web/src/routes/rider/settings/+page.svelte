<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import * as Select from '$lib/components/ui/select';
	import { Input } from '$lib/components/ui/input';
	import { Bike, MapPin, Moon, Languages, LogOut, UserCog, Wallet, Circle } from 'lucide-svelte';

	// Import vehicle types from the constants
	const VEHICLE_TYPES = ['BICYCLE', 'MOTORCYCLE', 'CAR'] as const;

	let settings = $state({
		profile: {
			firstName: '',
			lastName: '',
			email: '',
			address: '',
			addressName: ''
		},
		vehicle: {
			type: 'BICYCLE',
			license: ''
		},
		delivery: {
			maxDeliveryDistance: 10
		},
		appearance: {
			theme: 'system',
			language: 'en'
		},
		bankInfo: {
			accountNumber: '',
			bankName: '',
			accountName: ''
		}
	});

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
	function saveSettings() {
		// TODO: Implement save functionality
	}
</script>

<div class="space-y-8">
	<div>
		<h2 class="text-2xl font-bold">Rider Settings</h2>
		<p class="text-muted-foreground">Manage your account and delivery preferences</p>
	</div>

	<!-- Vehicle Settings -->
	<Card class="p-6">
		<div class="mb-6 flex items-center gap-2">
			<Bike class="h-5 w-5" />
			<h3 class="font-semibold">Vehicle Information</h3>
		</div>
		<div class="space-y-4">
			<div>
				<div class="mb-2 font-medium">Vehicle Type</div>
				<Select.Root
					value={settings.vehicle.type}
					onValueChange={(v) => (settings.vehicle.type = v)}
				>
					<Select.Trigger class="w-full">
						<span class="capitalize">{settings.vehicle.type.toLowerCase()}</span>
					</Select.Trigger>
					<Select.Content>
						{#each VEHICLE_TYPES as type}
							<Select.Item value={type}>{type.toLowerCase()}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<div>
				<div class="mb-2 font-medium">Vehicle License</div>
				<Input
					type="text"
					bind:value={settings.vehicle.license}
					placeholder="Enter vehicle license number"
				/>
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
				<div class="mb-2 font-medium">Maximum Delivery Distance</div>
				<div class="flex items-center gap-2">
					<Input
						type="number"
						bind:value={settings.delivery.maxDeliveryDistance}
						min="1"
						max="50"
					/>
					<span class="text-sm text-muted-foreground">km</span>
				</div>
			</div>
			<div>
				<div class="mb-2 font-medium">Default Address</div>
				<Input
					type="text"
					bind:value={settings.profile.address}
					placeholder="Enter your default address"
				/>
			</div>
		</div>
	</Card>

	<!-- Bank Information -->
	<Card class="p-6">
		<div class="mb-6 flex items-center gap-2">
			<Wallet class="h-5 w-5" />
			<h3 class="font-semibold">Payment Information</h3>
		</div>
		<div class="space-y-4">
			<div>
				<div class="mb-2 font-medium">Bank Name</div>
				<Input type="text" bind:value={settings.bankInfo.bankName} placeholder="Enter bank name" />
			</div>
			<div>
				<div class="mb-2 font-medium">Account Number</div>
				<Input
					type="text"
					bind:value={settings.bankInfo.accountNumber}
					placeholder="Enter account number"
				/>
			</div>
			<div>
				<div class="mb-2 font-medium">Account Name</div>
				<Input
					type="text"
					bind:value={settings.bankInfo.accountName}
					placeholder="Enter account name"
				/>
			</div>
		</div>
	</Card>

	<!-- Personal Information -->
	<Card class="p-6">
		<div class="mb-6 flex items-center gap-2">
			<UserCog class="h-5 w-5" />
			<h3 class="font-semibold">Personal Information</h3>
		</div>
		<div class="space-y-4">
			<div class="grid grid-cols-2 gap-4">
				<div>
					<div class="mb-2 font-medium">First Name</div>
					<Input
						type="text"
						bind:value={settings.profile.firstName}
						placeholder="Enter first name"
					/>
				</div>
				<div>
					<div class="mb-2 font-medium">Last Name</div>
					<Input type="text" bind:value={settings.profile.lastName} placeholder="Enter last name" />
				</div>
			</div>
			<div>
				<div class="mb-2 font-medium">Email</div>
				<Input type="email" bind:value={settings.profile.email} placeholder="Enter email" />
			</div>
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
				<div class="mb-2 font-medium">Theme</div>
				<Select.Root
					value={settings.appearance.theme}
					onValueChange={(v) => (settings.appearance.theme = v)}
				>
					<Select.Trigger class="w-full">
						<span class="capitalize">{settings.appearance.theme}</span>
					</Select.Trigger>
					<Select.Content>
						{#each themes as theme}
							<Select.Item value={theme.value}>{theme.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<div>
				<div class="mb-2 font-medium">Language</div>
				<Select.Root
					value={settings.appearance.language}
					onValueChange={(v) => (settings.appearance.language = v)}
				>
					<Select.Trigger class="w-full">
						{languages.find((l) => l.value === settings.appearance.language)?.label}
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
		<Button variant="outline">Cancel</Button>
		<Button on:click={saveSettings}>Save Changes</Button>
	</div>

	<!-- Account Actions -->
	<Card class="p-6">
		<div class="flex items-center justify-between">
			<div>
				<div class="font-medium">Sign Out</div>
				<div class="text-sm text-muted-foreground">Sign out from all devices</div>
			</div>
			<Button variant="destructive">
				<LogOut class="mr-2 h-4 w-4" />
				Sign Out
			</Button>
		</div>
	</Card>
</div>
