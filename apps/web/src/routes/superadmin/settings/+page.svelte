<script lang="ts">
	import { adminState } from '$lib/states/adminState.svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { Slider } from '$lib/components/ui/slider';
	import {
		Settings,
		DollarSign,
		Bell,
		Shield,
		Map,
		Truck,
		MessageSquare,
		Mail,
		Phone
	} from 'lucide-svelte';

	// Platform Settings
	let platformSettings = $state({
		commission: {
			rate: 15,
			minimumAmount: 1.0
		},
		delivery: {
			baseRate: 5.0,
			perKmRate: 0.5,
			maxDistance: 20
		},
		notifications: {
			email: true,
			sms: true,
			push: true
		},
		security: {
			twoFactorAuth: true,
			passwordExpiry: 90,
			sessionTimeout: 30
		}
	});

	// Communication Settings
	let communicationSettings = $state({
		email: {
			provider: 'SendGrid',
			apiKey: '****************************',
			fromEmail: 'noreply@africanmarket.com',
			templates: {
				welcome: true,
				orderConfirmation: true,
				deliveryUpdates: true,
				marketing: false
			}
		},
		sms: {
			provider: 'Twilio',
			apiKey: '****************************',
			fromNumber: '+1234567890',
			templates: {
				verification: true,
				orderStatus: true,
				delivery: true
			}
		}
	});

	// Map Settings
	let mapSettings = $state({
		provider: 'Google Maps',
		apiKey: '****************************',
		defaultCenter: {
			lat: 9.082,
			lng: 8.6753
		},
		defaultZoom: 12
	});

	async function updateSettings() {
		await adminState.updateSystemSettings({
			platform: platformSettings,
			communication: communicationSettings,
			map: mapSettings
		});
		// Handle settings update
	}
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-bold">System Settings</h2>
		<Button onclick={updateSettings}>Save Changes</Button>
	</div>

	<div class="grid gap-6">
		<!-- Platform Settings -->
		<Card class="p-6">
			<div class="mb-6 flex items-center gap-2">
				<Settings class="h-5 w-5 text-primary" />
				<h3 class="font-semibold">Platform Settings</h3>
			</div>

			<div class="grid gap-8">
				<!-- Commission Settings -->
				<div class="space-y-4">
					<h4 class="font-medium">Commission</h4>
					<div class="grid gap-4 sm:grid-cols-2">
						<div class="space-y-2">
							<Label>Commission Rate (%)</Label>
							<div class="flex items-center gap-4">
								<Slider min={0} max={30} step={0.5} bind:value={platformSettings.commission.rate} />
								<span class="w-12 text-right">{platformSettings.commission.rate}%</span>
							</div>
						</div>
						<div class="space-y-2">
							<Label>Minimum Commission Amount</Label>
							<div class="flex items-center gap-2">
								<DollarSign class="h-4 w-4 text-muted-foreground" />
								<Input
									type="number"
									min="0"
									step="0.1"
									bind:value={platformSettings.commission.minimumAmount}
								/>
							</div>
						</div>
					</div>
				</div>

				<!-- Delivery Settings -->
				<div class="space-y-4">
					<h4 class="font-medium">Delivery</h4>
					<div class="grid gap-4 sm:grid-cols-3">
						<div class="space-y-2">
							<Label>Base Rate</Label>
							<div class="flex items-center gap-2">
								<DollarSign class="h-4 w-4 text-muted-foreground" />
								<Input
									type="number"
									min="0"
									step="0.5"
									bind:value={platformSettings.delivery.baseRate}
								/>
							</div>
						</div>
						<div class="space-y-2">
							<Label>Per KM Rate</Label>
							<div class="flex items-center gap-2">
								<DollarSign class="h-4 w-4 text-muted-foreground" />
								<Input
									type="number"
									min="0"
									step="0.1"
									bind:value={platformSettings.delivery.perKmRate}
								/>
							</div>
						</div>
						<div class="space-y-2">
							<Label>Maximum Distance (KM)</Label>
							<Input type="number" min="1" bind:value={platformSettings.delivery.maxDistance} />
						</div>
					</div>
				</div>

				<!-- Notification Settings -->
				<div class="space-y-4">
					<h4 class="font-medium">Notifications</h4>
					<div class="grid gap-4 sm:grid-cols-3">
						<div class="flex items-center justify-between">
							<div class="space-y-0.5">
								<Label>Email Notifications</Label>
								<div class="text-sm text-muted-foreground">Receive updates via email</div>
							</div>
							<Switch bind:checked={platformSettings.notifications.email} />
						</div>
						<div class="flex items-center justify-between">
							<div class="space-y-0.5">
								<Label>SMS Notifications</Label>
								<div class="text-sm text-muted-foreground">Receive updates via SMS</div>
							</div>
							<Switch bind:checked={platformSettings.notifications.sms} />
						</div>
						<div class="flex items-center justify-between">
							<div class="space-y-0.5">
								<Label>Push Notifications</Label>
								<div class="text-sm text-muted-foreground">Receive push notifications</div>
							</div>
							<Switch bind:checked={platformSettings.notifications.push} />
						</div>
					</div>
				</div>

				<!-- Security Settings -->
				<div class="space-y-4">
					<h4 class="font-medium">Security</h4>
					<div class="grid gap-4 sm:grid-cols-3">
						<div class="flex items-center justify-between">
							<div class="space-y-0.5">
								<Label>Two-Factor Authentication</Label>
								<div class="text-sm text-muted-foreground">Require 2FA for admin access</div>
							</div>
							<Switch bind:checked={platformSettings.security.twoFactorAuth} />
						</div>
						<div class="space-y-2">
							<Label>Password Expiry (days)</Label>
							<Input type="number" min="0" bind:value={platformSettings.security.passwordExpiry} />
						</div>
						<div class="space-y-2">
							<Label>Session Timeout (minutes)</Label>
							<Input type="number" min="5" bind:value={platformSettings.security.sessionTimeout} />
						</div>
					</div>
				</div>
			</div>
		</Card>

		<!-- Communication Settings -->
		<Card class="p-6">
			<div class="mb-6 flex items-center gap-2">
				<MessageSquare class="h-5 w-5 text-primary" />
				<h3 class="font-semibold">Communication Settings</h3>
			</div>

			<div class="grid gap-8">
				<!-- Email Settings -->
				<div class="space-y-4">
					<h4 class="font-medium">Email Configuration</h4>
					<div class="grid gap-4">
						<div class="grid gap-4 sm:grid-cols-2">
							<div class="space-y-2">
								<Label>Email Provider</Label>
								<Input value={communicationSettings.email.provider} readonly />
							</div>
							<div class="space-y-2">
								<Label>API Key</Label>
								<Input type="password" value={communicationSettings.email.apiKey} readonly />
							</div>
						</div>
						<div class="space-y-2">
							<Label>From Email</Label>
							<Input bind:value={communicationSettings.email.fromEmail} />
						</div>
						<div class="grid gap-4 sm:grid-cols-2">
							{#each Object.entries(communicationSettings.email.templates) as [template, enabled]}
								<div class="flex items-center justify-between">
									<Label class="capitalize">{template.replace(/([A-Z])/g, ' $1').trim()}</Label>
									<Switch bind:checked={communicationSettings.email.templates[template]} />
								</div>
							{/each}
						</div>
					</div>
				</div>

				<!-- SMS Settings -->
				<div class="space-y-4">
					<h4 class="font-medium">SMS Configuration</h4>
					<div class="grid gap-4">
						<div class="grid gap-4 sm:grid-cols-2">
							<div class="space-y-2">
								<Label>SMS Provider</Label>
								<Input value={communicationSettings.sms.provider} readonly />
							</div>
							<div class="space-y-2">
								<Label>API Key</Label>
								<Input type="password" value={communicationSettings.sms.apiKey} readonly />
							</div>
						</div>
						<div class="space-y-2">
							<Label>From Number</Label>
							<Input bind:value={communicationSettings.sms.fromNumber} />
						</div>
						<div class="grid gap-4 sm:grid-cols-2">
							{#each Object.entries(communicationSettings.sms.templates) as [template, enabled]}
								<div class="flex items-center justify-between">
									<Label class="capitalize">{template.replace(/([A-Z])/g, ' $1').trim()}</Label>
									<Switch bind:checked={communicationSettings.sms.templates[template]} />
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</Card>

		<!-- Map Settings -->
		<Card class="p-6">
			<div class="mb-6 flex items-center gap-2">
				<Map class="h-5 w-5 text-primary" />
				<h3 class="font-semibold">Map Settings</h3>
			</div>

			<div class="grid gap-4">
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label>Map Provider</Label>
						<Input value={mapSettings.provider} readonly />
					</div>
					<div class="space-y-2">
						<Label>API Key</Label>
						<Input type="password" value={mapSettings.apiKey} readonly />
					</div>
				</div>
				<div class="grid gap-4 sm:grid-cols-3">
					<div class="space-y-2">
						<Label>Default Latitude</Label>
						<Input type="number" step="0.0001" bind:value={mapSettings.defaultCenter.lat} />
					</div>
					<div class="space-y-2">
						<Label>Default Longitude</Label>
						<Input type="number" step="0.0001" bind:value={mapSettings.defaultCenter.lng} />
					</div>
					<div class="space-y-2">
						<Label>Default Zoom Level</Label>
						<Input type="number" min="1" max="20" bind:value={mapSettings.defaultZoom} />
					</div>
				</div>
			</div>
		</Card>
	</div>
</div>
