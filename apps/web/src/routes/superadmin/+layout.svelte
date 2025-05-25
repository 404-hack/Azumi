<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { adminState } from '$lib/states/adminState.svelte';
	import {
		LayoutDashboard,
		Store,
		Users,
		Bike,
		ShoppingBag,
		Settings,
		FileText,
		AlertTriangle,
		Bell,
		LogOut,
		Menu,
		X
	} from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Badge } from '$lib/components/ui/badge';

	let isSidebarOpen = $state(false);
	let currentPath = $derived($page.url.pathname);

	const navigation = [
		{
			name: 'Dashboard',
			href: '/superadmin',
			icon: LayoutDashboard,
			isActive: (path: string) => path === '/superadmin'
		},
		{
			name: 'Vendors',
			href: '/superadmin/vendors',
			icon: Store,
			isActive: (path: string) => path.startsWith('/superadmin/vendors')
		},
		{
			name: 'Customers',
			href: '/superadmin/customers',
			icon: Users,
			isActive: (path: string) => path.startsWith('/superadmin/customers')
		},
		{
			name: 'Riders',
			href: '/superadmin/riders',
			icon: Bike,
			isActive: (path: string) => path.startsWith('/superadmin/riders')
		},
		{
			name: 'Orders',
			href: '/superadmin/orders',
			icon: ShoppingBag,
			isActive: (path: string) => path.startsWith('/superadmin/orders')
		},
		{
			name: 'Disputes',
			href: '/superadmin/disputes',
			icon: AlertTriangle,
			isActive: (path: string) => path.startsWith('/superadmin/disputes')
		},
		{
			name: 'Settings',
			href: '/superadmin/settings',
			icon: Settings,
			isActive: (path: string) => path.startsWith('/superadmin/settings')
		},
		{
			name: 'Reports',
			href: '/superadmin/reports',
			icon: FileText,
			isActive: (path: string) => path.startsWith('/superadmin/reports')
		},
		{
			name: 'Promotions',
			href: '/superadmin/promotions',
			icon: Bell,
			isActive: (path: string) => path.startsWith('/superadmin/promotions')
		}
	];

	// Mock notifications
	const notifications = [
		{
			id: 1,
			title: 'New Vendor Application',
			message: 'Restaurant ABC has applied to join the platform'
		},
		{ id: 2, title: 'New Dispute', message: 'Customer dispute requires attention' },
		{ id: 3, title: 'System Alert', message: 'High order volume detected' }
	];

	function handleLogout() {
		// In real app, call adminState.logout
		console.log('Logging out...');
	}
</script>

<div class="flex h-screen">
	<!-- Mobile sidebar backdrop -->
	{#if isSidebarOpen}
		<div
			class="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
			onclick={() => (isSidebarOpen = false)}
		/>
	{/if}

	<!-- Sidebar -->
	<div
		class="fixed inset-y-0 z-50 flex w-72 flex-col bg-muted/40 transition-transform duration-300 lg:static lg:translate-x-0 {isSidebarOpen
			? 'translate-x-0'
			: '-translate-x-full'}"
	>
		<div class="flex h-14 items-center border-b px-4">
			<span class="font-semibold">Azumi</span>
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
				<a
					href={item.href}
					onclick={() => (isSidebarOpen = false)}
					class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground {item.isActive(
						$page.url.pathname
					)
						? 'bg-accent text-accent-foreground'
						: 'text-muted-foreground'}"
				>
					<svelte:component this={item.icon} class="h-4 w-4" />
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
					<div class="h-8 w-8 rounded-full bg-muted" />
					<div>
						<div class="text-sm font-medium">Admin User</div>
						<div class="text-xs text-muted-foreground">admin@example.com</div>
					</div>
				</div>
			</div>
		</div>

		<div class="p-6">
			<slot />
		</div>
	</div>
</div>
