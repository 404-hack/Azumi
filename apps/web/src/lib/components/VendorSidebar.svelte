<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Badge } from '$lib/components/ui/badge';
	import {
		HelpCircle,
		ClipboardList,
		Menu,
		Wallet,
		BarChart2,
		UserCircle,
		ChevronLeft,
		LogOut,
		Store,
		Tag
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { page } from '$app/state';
	import { Switch } from '$lib/components/ui/switch';
	import { cn, initials } from '$lib/utils';
	import { authClient } from '$lib/auth-client';

	let isCollapsed = $state(false);
	let isStoreOpen = $state(true);
	let pendingOrders = 0;
	let data = page.data;
	const sidebarItems = [
		{
			id: 1,
			title: 'Orders',
			icon: ClipboardList,
			href: '/vendor/orders',
			badge: pendingOrders
		},
		{
			id: 2,
			title: 'Menu',
			icon: Menu,
			href: '/vendor/menu'
		},
		{
			id: 2,
			title: 'Categories',
			icon: Tag,
			href: '/vendor/categories'
		},
		{
			id: 3,
			title: 'Payouts',
			icon: Wallet,
			href: '/vendor/wallet'
		},
		{
			id: 4,
			title: 'Insights',
			icon: BarChart2,
			disabled: true,
			badgeText: 'Coming Soon',
			badgeVariant: 'secondary'
		},
		{
			id: 5,
			title: 'Profile',
			icon: UserCircle,
			href: '/vendor/profile'
		}
	];

	function toggleSidebar() {
		isCollapsed = !isCollapsed;
	}

	function toggleStoreStatus() {
		isStoreOpen = !isStoreOpen;
	}
	const activeOrganization = authClient.useActiveOrganization();

	const member = authClient.organization.getActiveMember();
	const organizations = authClient.useListOrganizations();
</script>

<Sidebar.Root class="bg-background border-r">
	<div class="space-y-4 py-4">
		<div class="px-3 py-2">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<div
						class="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-full"
					>
						{initials($activeOrganization.data?.name)}
					</div>
					<div class="space-y-1">
						<h2 class="text-lg font-semibold tracking-tight">{$activeOrganization.data?.name}</h2>
						{#await authClient.organization.getActiveMember() then member}
							<Badge variant="secondary" class="uppercase">{member.data?.role}</Badge>
						{/await}
					</div>
				</div>
			</div>
			<div class="mt-4 flex items-center justify-between rounded-lg border p-2">
				<div class="flex items-center gap-2">
					<Store class="h-4 w-4" />
					<span class="text-sm font-medium">Store Status</span>
				</div>
				<!-- <Switch checked={$activeOrganization.data?.metadata.active} /> -->
			</div>
		</div>
		<div class="px-3">
			<div class="space-y-1">
				{#each sidebarItems as { href, icon: Icon, title, badge, disabled, badgeText, badgeVariant }}
					{#if disabled}
						<div
							class="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium opacity-60"
						>
							<Icon class="h-4 w-4" />
							<span>{title}</span>
							{#if badgeText}
								<Badge variant={badgeVariant || 'outline'} class="ml-auto">{badgeText}</Badge>
							{/if}
						</div>
					{:else}
						<a
							{href}
							class={cn(
								'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
								page.url.pathname === href && 'bg-primary text-primary-foreground'
							)}
						>
							<Icon class="h-4 w-4" />
							<span>{title}</span>
							{#if badge}
								<Badge variant="destructive" class="ml-auto">{badge}</Badge>
							{/if}
						</a>
					{/if}
				{/each}
			</div>
		</div>
		<div class="px-3">
			<div class="space-y-1">
				<Button
					variant="ghost"
					href="/restaurant/{$activeOrganization.data?.slug}"
					class="w-full justify-start"
				>
					<Store class="mr-2 h-4 w-4" />
					Store front
				</Button>
				<Button variant="ghost" class="w-full justify-start">
					<HelpCircle class="mr-2 h-4 w-4" />
					Help & Support
				</Button>
				<Button variant="ghost" class="w-full justify-start">
					<LogOut class="mr-2 h-4 w-4" />
					Logout
				</Button>
			</div>
		</div>
	</div>
</Sidebar.Root>
