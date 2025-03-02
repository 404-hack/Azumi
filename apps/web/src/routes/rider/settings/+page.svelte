<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import * as Select from '$lib/components/ui/select';
	import { Bell, Volume2, MapPin, Moon, Languages, Shield, LogOut } from 'lucide-svelte';

	let settings = $state({
		notifications: {
			newOrders: true,
			orderUpdates: true,
			earnings: true,
			promotions: false
		},
		sound: {
			enabled: true,
			volume: 80
		},
		location: {
			tracking: true,
			shareWithCustomer: true
		},
		appearance: {
			theme: 'system',
			language: 'en'
		},
		privacy: {
			shareRating: true,
			shareStats: true
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
</script>

<div class="space-y-8">
	<div>
		<h2 class="text-2xl font-bold">Settings</h2>
		<p class="text-muted-foreground">Manage your app preferences and account settings</p>
	</div>

	<!-- Notifications -->
	<Card class="p-6">
		<div class="mb-6 flex items-center gap-2">
			<Bell class="h-5 w-5" />
			<h3 class="font-semibold">Notifications</h3>
		</div>
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<div>
					<div class="font-medium">New Orders</div>
					<div class="text-sm text-muted-foreground">
						Get notified when new orders are available
					</div>
				</div>
				<Switch
					checked={settings.notifications.newOrders}
					onCheckedChange={(v) => (settings.notifications.newOrders = v)}
				/>
			</div>
			<div class="flex items-center justify-between">
				<div>
					<div class="font-medium">Order Updates</div>
					<div class="text-sm text-muted-foreground">
						Receive updates about your current delivery
					</div>
				</div>
				<Switch
					checked={settings.notifications.orderUpdates}
					onCheckedChange={(v) => (settings.notifications.orderUpdates = v)}
				/>
			</div>
			<div class="flex items-center justify-between">
				<div>
					<div class="font-medium">Earnings</div>
					<div class="text-sm text-muted-foreground">
						Get notified about your earnings and payouts
					</div>
				</div>
				<Switch
					checked={settings.notifications.earnings}
					onCheckedChange={(v) => (settings.notifications.earnings = v)}
				/>
			</div>
			<div class="flex items-center justify-between">
				<div>
					<div class="font-medium">Promotions</div>
					<div class="text-sm text-muted-foreground">
						Receive updates about bonuses and promotions
					</div>
				</div>
				<Switch
					checked={settings.notifications.promotions}
					onCheckedChange={(v) => (settings.notifications.promotions = v)}
				/>
			</div>
		</div>
	</Card>

	<!-- Sound -->
	<Card class="p-6">
		<div class="mb-6 flex items-center gap-2">
			<Volume2 class="h-5 w-5" />
			<h3 class="font-semibold">Sound</h3>
		</div>
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<div>
					<div class="font-medium">Sound Effects</div>
					<div class="text-sm text-muted-foreground">Play sounds for notifications and actions</div>
				</div>
				<Switch
					checked={settings.sound.enabled}
					onCheckedChange={(v) => (settings.sound.enabled = v)}
				/>
			</div>
			{#if settings.sound.enabled}
				<div>
					<div class="mb-2 font-medium">Volume</div>
					<input type="range" min="0" max="100" bind:value={settings.sound.volume} class="w-full" />
				</div>
			{/if}
		</div>
	</Card>

	<!-- Location -->
	<Card class="p-6">
		<div class="mb-6 flex items-center gap-2">
			<MapPin class="h-5 w-5" />
			<h3 class="font-semibold">Location</h3>
		</div>
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<div>
					<div class="font-medium">Location Tracking</div>
					<div class="text-sm text-muted-foreground">
						Allow app to track your location while delivering
					</div>
				</div>
				<Switch
					checked={settings.location.tracking}
					onCheckedChange={(v) => (settings.location.tracking = v)}
				/>
			</div>
			<div class="flex items-center justify-between">
				<div>
					<div class="font-medium">Share with Customer</div>
					<div class="text-sm text-muted-foreground">
						Let customers track your location during delivery
					</div>
				</div>
				<Switch
					checked={settings.location.shareWithCustomer}
					onCheckedChange={(v) => (settings.location.shareWithCustomer = v)}
				/>
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

	<!-- Privacy -->
	<Card class="p-6">
		<div class="mb-6 flex items-center gap-2">
			<Shield class="h-5 w-5" />
			<h3 class="font-semibold">Privacy</h3>
		</div>
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<div>
					<div class="font-medium">Share Rating</div>
					<div class="text-sm text-muted-foreground">Show your rating to customers</div>
				</div>
				<Switch
					checked={settings.privacy.shareRating}
					onCheckedChange={(v) => (settings.privacy.shareRating = v)}
				/>
			</div>
			<div class="flex items-center justify-between">
				<div>
					<div class="font-medium">Share Statistics</div>
					<div class="text-sm text-muted-foreground">Share your delivery statistics publicly</div>
				</div>
				<Switch
					checked={settings.privacy.shareStats}
					onCheckedChange={(v) => (settings.privacy.shareStats = v)}
				/>
			</div>
		</div>
	</Card>

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
