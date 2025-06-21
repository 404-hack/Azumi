<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		loginModalState,
		cartsSheetStore,
		addDeliveryAddressModalState
	} from '$lib/states/modalState.svelte';
	import ResponsiveDropdown from '$lib/components/ResponsiveDropdown.svelte';

	import CartsSheet from './modal/CartsSheet.svelte';
	import {
		MapPin,
		Search,
		ShoppingBag,
		ChevronDown,
		Menu,
		ShoppingCart,
		Store,
		User,
		Heart,
		Settings,
		Package,
		ChevronRight
	} from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import LoginModal from './modal/LoginModal.svelte';
	import { page } from '$app/state';
	import { authClient } from '$lib/auth-client';
	import { goto, invalidateAll } from '$app/navigation';
	import { Badge } from '$lib/components/ui/badge';
	import type { Place } from '$lib/types/places';
	import AddDeliveryAddress from './modal/AddDeliveryAddress.svelte';
	import { activeLocation } from '$lib/states/locationState.svelte';

	let user = $derived(page.data.user);
	const organizations = authClient.useListOrganizations();
	let isAdmin = $derived(user?.role === 'admin' || user?.role === 'super_admin');
</script>

<header
	class=" bg-background/95 supports-[backdrop-filter]:bg-background/60 top-0 z-50 w-full border-b backdrop-blur transition-all duration-200"
>
	<div class="container flex h-16 w-full items-center justify-between gap-4">
		<!-- Logo and Locatio`n -->
		<div class="flex items-center gap-4">
			<a href="/" class="flex items-center space-x-2">
				<img src="/logo.webp" alt="Azumi" class="size-10" />
				<span class="text-primary hidden text-xl font-bold md:inline">Azumi</span>
			</a>
			{#if activeLocation.current.lat != 0 && activeLocation.current.lng != 0}
				<button
					class="text-muted-foreground hover:text-primary group flex items-center gap-2 text-sm font-medium transition-colors"
					aria-label="Change location"
					onclick={() => {
						addDeliveryAddressModalState.setTrue();
					}}
				>
					<MapPin class="h-4 w-4" />
					<span class="max-w-[150px] truncate md:max-w-[300px]"
						>{activeLocation.current.address}</span
					>
					<ChevronDown class="h-4 w-4 transition-transform group-hover:rotate-180" />
				</button>
			{/if}
		</div>
		<LoginModal />

		<AddDeliveryAddress />

		<!-- Search -->
		<!-- <div class="hidden max-w-xl flex-1 px-4 md:flex">
			<div class="relative w-full">
				<Search
					class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					type="search"
					placeholder="Search restaurants or dishes..."
					class="w-full pl-10 pr-4 transition-all focus-visible:ring-2 focus-visible:ring-primary"
					bind:value={searchQuery}
					aria-label="Search"
				/>
			</div>
		</div> -->
		<!-- User Navigation -->
		<div class="flex items-center gap-3">
			<!-- Order Sheet Button - Hidden on mobile -->
			{#if page.data.carts && page.data.carts.length}
				<CartsSheet />
				<Button
					variant="outline"
					size="icon"
					class="relative hidden items-center gap-2 md:flex"
					onclick={() => cartsSheetStore.setTrue()}
				>
					<ShoppingCart class="h-5 w-5" />
					<Badge
						class="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full"
					>
						{page.data.carts.length}
					</Badge>
				</Button>
			{/if}

			{#if user}
				<nav class="flex items-center gap-3">
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							<button
								class="bg-background focus-visible:ring-ring focus-visible:ring-offset-background flex items-center gap-1.5 rounded-full p-1 pr-2 text-white shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
								aria-label="User menu"
							>
								<Avatar class="h-8 w-8">
									<AvatarImage src={user.image ?? undefined} alt={user.name ?? 'User'} />
									<AvatarFallback class="bg-primary/70 text-sm font-medium ">
										{(
											user.name
												?.split(' ')
												.map((n) => n[0])
												.join('')
												.toUpperCase() ||
											user.email?.charAt(0).toUpperCase() ||
											'U'
										).substring(0, 2)}
									</AvatarFallback>
								</Avatar>
								<ChevronDown class="h-4 w-4 text-neutral-400" />
							</button>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content class="w-56" align="end">
							<DropdownMenu.Label>My Account</DropdownMenu.Label>
							<DropdownMenu.Separator />

							<DropdownMenu.Item class="cursor-pointer p-3">
								<a href="/me/personal-info" class="flex w-full items-center justify-between">
									<div class="flex items-center gap-3">
										<Avatar class="h-10 w-10">
											<AvatarImage src={user.image ?? undefined} alt={user.name ?? 'User'} />
											<AvatarFallback class="bg-primary/50 font-medium text-white">
												{user.name
													?.split(' ')
													.map((n) => n[0])
													.join('')
													.toUpperCase() ||
													(user.email?.charAt(0).toUpperCase() ?? 'P')}
											</AvatarFallback>
										</Avatar>
										<div class="flex flex-col">
											<span class="text-muted-foreground text-sm">Profile</span>
											<span class="text-foreground text-base font-semibold"
												>{user.name ?? 'User Profile'}</span
											>
										</div>
									</div>
									<!-- Ensure ChevronRight is imported from lucide-svelte -->
									<ChevronRight class="text-muted-foreground h-5 w-5" />
								</a>
							</DropdownMenu.Item>

							<!-- Cart Button for Mobile -->
							{#if page.data.carts && page.data.carts.length}
								<DropdownMenu.Separator class="md:hidden" />
								<DropdownMenu.Item
									class="cursor-pointer md:hidden"
									onclick={() => cartsSheetStore.setTrue()}
								>
									<div class="flex w-full items-center justify-between">
										<div class="flex items-center gap-3">
											<ShoppingCart class="h-4 w-4" />
											<span>My Cart</span>
										</div>
										<Badge class="flex h-5 w-5 items-center justify-center rounded-full text-xs">
											{page.data.carts.length}
										</Badge>
									</div>
								</DropdownMenu.Item>
							{/if}

							{#if isAdmin}
								<DropdownMenu.Separator />
								<DropdownMenu.Item>
									<a href="/superadmin" class="flex w-full items-center">
										<Settings class="mr-2 h-4 w-4" />
										<span>Admin Dashboard</span>
									</a>
								</DropdownMenu.Item>
							{/if}
							<DropdownMenu.Separator />
							{#if $organizations.isPending}
								<p>Loading...</p>
							{:else if $organizations.data === null}
								<span class="sr-only">no organizations</span>
							{:else}
								{#each $organizations.data as organization}
									<DropdownMenu.Item
										onclick={async () => {
											await authClient.organization.setActive({
												organizationSlug: organization.slug
											});
											await goto('/vendor/menu', {
												invalidateAll: true
											});
										}}
									>
										<Store />
										{organization.name}
									</DropdownMenu.Item>
								{/each}
							{/if}

							<DropdownMenu.Separator />
							<DropdownMenu.Item class="text-red-500">
								<button
									onclick={async () => {
										authClient.signOut();
										await invalidateAll();
									}}
									class="flex w-full"
								>
									Log out
								</button>
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</nav>
			{:else}
				<div class=" flex items-center gap-2">
					<Button onclick={() => loginModalState.setTrue()} variant="ghost" size="sm">Login</Button>
				</div>
			{/if}

			<!-- Mobile Menu Button -->
		</div>
	</div>
</header>
<!-- <Button
				variant="ghost"
				size="icon"
				class="md:hidden"
				onclick={() => (isMobileMenuOpen = !isMobileMenuOpen)}
				aria-label="Menu"
			>
				<Menu class="h-5 w-5" />
			</Button> -->
<!-- Mobile Search and Navigation -->
<!-- {#if isMobileMenuOpen}
	<div class="border-t p-4 duration-300 animate-in slide-in-from-top md:hidden">
		<div class="relative mb-4">
			<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				type="search"
				placeholder="Search..."
				class="w-full pl-10"
				bind:value={searchQuery}
			/>
		</div>

		<div class="flex flex-col gap-2">
			{#if page.data.carts && page.data.carts.length}
				<Button variant="outline" onclick={() => cartsSheetStore.setTrue()} class="justify-start">
					<ShoppingBag class="mr-2 h-4 w-4" />
					Orders
				</Button>
			{/if}

			{#if !user}
				<Button onclick={() => loginModalState.setTrue()} variant="ghost" class="justify-start"
					>Login</Button
				>
				
			{/if}

			<Button variant="ghost" class="justify-start">
				<MapPin class="mr-2 h-4 w-4" />
				{location}
			</Button>
		</div>
	</div>
{/if} -->
