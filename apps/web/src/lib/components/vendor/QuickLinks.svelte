<script lang="ts">
	import { Store, Coffee, DollarSign, MapPin, Settings, Clock, Wallet, Users } from 'lucide-svelte';

	// const links = [
	// 	{
	// 		id: 1,
	// 		title: 'Store Settings',
	// 		description: 'Manage your store information',
	// 		icon: Store,
	// 		href: '/vendor/settings/store'
	// 	},
	// 	{
	// 		id: 2,
	// 		title: 'Menu Items',
	// 		description: 'Add or edit your products',
	// 		icon: Coffee,
	// 		href: '/vendor/products'
	// 	},
	// 	{
	// 		id: 3,
	// 		title: 'Payments',
	// 		description: 'View earnings and payouts',
	// 		icon: DollarSign,
	// 		href: '/vendor/payments'
	// 	},
	// 	{
	// 		id: 4,
	// 		title: 'Delivery Zones',
	// 		description: 'Set delivery areas',
	// 		icon: MapPin,
	// 		href: '/vendor/delivery'
	// 	}
	// ];
	const links = [
		{ href: '/vendor/profile/edit', label: 'Store Details', icon: Store },
		{ href: '/vendor/store-operations', label: 'Store Operations', icon: Clock },
		{ href: '/vendor/wallet', label: 'Your Wallet', icon: Wallet },
		{ href: '/vendor/manage-users', label: 'Manage Users', icon: Users }
	];
</script>

<div class="grid grid-cols-1 gap-4">
	{#each links as link}
		<a
			href={link.href}
			class="flex items-center rounded-lg border border-border p-4 transition-colors hover:bg-muted"
		>
			<div class="mr-4 flex-shrink-0">
				<svelte:component this={link.icon} class="h-5 w-5 text-muted-foreground" />
			</div>
			<div>
				<h4 class="text-sm font-medium">{link.label}</h4>
			</div>
		</a>
	{/each}
</div>
