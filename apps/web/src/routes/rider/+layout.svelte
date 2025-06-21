<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { riderState } from '$lib/states/riderState.svelte';
	import { Bike, Clock, Wallet, Settings, LogOut, Menu, X, History } from 'lucide-svelte';
	import NotificationPermissionBanner from '$lib/components/NotificationPermissionBanner.svelte';
	import OrderAcceptanceModal from '$lib/components/OrderAcceptanceModal.svelte';
	import DebugPanel from '$lib/components/DebugPanel.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	let isSidebarOpen = $state(false);
	let currentPath = $derived(page.url.pathname);
	const navigation = [
		{
			name: 'Available Orders',
			href: '/rider',
			icon: Bike,
			isActive: (path: string) => path === '/rider'
		},
		// {
		// 	name: 'Active Delivery',
		// 	href: '/rider/deliveries/active',
		// 	icon: Clock,
		// 	isActive: (path: string) => path === '/rider/deliveries/active'
		// },
		{
			name: 'Order History',
			href: '/rider/orders/history',
			icon: History,
			isActive: (path: string) => path.startsWith('/rider/orders/history')
		},
		{
			name: 'Earnings',
			href: '/rider/earnings',
			icon: Wallet,
			isActive: (path: string) => path.startsWith('/rider/earnings')
		},
		{
			name: 'Settings',
			href: '/rider/settings',
			icon: Settings,
			isActive: (path: string) => path.startsWith('/rider/settings')
		}
	];
	function handleLogout() {
		// In real app, call riderState.logout
		console.log('Logging out...');
	}
</script>

<NotificationPermissionBanner context="rider" />

<div class="flex h-screen">
	<!-- Mobile sidebar backdrop -->
	{#if isSidebarOpen}
		<div
			class="bg-background/80 fixed inset-0 z-40 backdrop-blur-sm lg:hidden"
			role="button"
			tabindex="0"
			onclick={() => (isSidebarOpen = false)}
			onkeydown={(e) => e.key === 'Escape' && (isSidebarOpen = false)}
		></div>
	{/if}

	<!-- Sidebar -->
	<div
		class="bg-muted/40 fixed inset-y-0 z-50 flex w-72 flex-col transition-transform duration-300 lg:static lg:translate-x-0 {isSidebarOpen
			? 'translate-x-0'
			: '-translate-x-full'}"
	>
		<div class="flex h-14 items-center border-b px-4">
			<span class="font-semibold">Rider Dashboard</span>
			<!-- Close button for mobile -->
			<Button
				variant="ghost"
				size="icon"
				class="ml-auto lg:hidden"
				onclick={() => (isSidebarOpen = false)}
			>
				<X class="h-5 w-5" />
				<span class="sr-only">Close sidebar</span>
			</Button>
		</div>
		<nav class="flex-1 space-y-1 p-2">
			{#each navigation as item}
				{@const IconComponent = item.icon}
				<a
					href={item.href}
					onclick={() => (isSidebarOpen = false)}
					class="hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium {item.isActive(
						page.url.pathname
					)
						? 'bg-accent text-accent-foreground'
						: 'text-muted-foreground'}"
				>
					<IconComponent class="h-4 w-4" />
					{item.name}
				</a>
			{/each}
		</nav>

		<div class="border-t p-2">
			<Button variant="ghost" class="w-full justify-start gap-3" onclick={handleLogout}>
				<LogOut class="h-4 w-4" />
				<span>Log Out</span>
			</Button>
		</div>
	</div>

	<!-- Main content -->
	<div class="flex-1 overflow-auto">
		<div class="flex h-14 items-center gap-4 border-b px-4">
			<!-- Mobile menu button -->
			<Button variant="ghost" size="icon" class="lg:hidden" onclick={() => (isSidebarOpen = true)}>
				<Menu class="h-5 w-5" />
				<span class="sr-only">Open sidebar</span>
			</Button>
			<div class="ml-auto flex items-center gap-4">
				<div class="flex items-center gap-2">
					<div class="bg-muted h-8 w-8 rounded-full"></div>
					<div>
						<div class="text-sm font-medium">John Rider</div>
						<div class="text-muted-foreground text-xs">rider@example.com</div>
					</div>
				</div>
			</div>
		</div>
		<div class="p-6">
			{@render children()}
		</div>
	</div>
</div>

<!-- Order Acceptance Modal - Global overlay for all rider pages -->
<OrderAcceptanceModal />

<!-- Debug Panel - Remove in production -->

<DebugPanel />
