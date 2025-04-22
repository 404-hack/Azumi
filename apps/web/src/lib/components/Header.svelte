<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		loginModalState,
		cartsSheetStore,
		registerModalState,
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
		Package
	} from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import LoginModal from './modal/LoginModal.svelte';
	import RegisterModal from './modal/RegisterModal.svelte';
	import { page } from '$app/state';
	import { authClient } from '$lib/auth-client';
	import { goto, invalidateAll } from '$app/navigation';
	import { Badge } from '$lib/components/ui/badge';
	import type { Place } from '$lib/types/places';
	import AddDeliveryAddress from './modal/AddDeliveryAddress.svelte';
	import { activeLocation } from '$lib/states/locationState.svelte';
	import Label from './ui/label/label.svelte';
	import Separator from './ui/separator/separator.svelte';

	let location = 'Nairobi, Kenya';
	let searchQuery = '';
	let isMobileMenuOpen = $state(false);

	let user = $derived(page.data.user);
	const organizations = authClient.useListOrganizations();
</script>

<header
	class=" top-0 z-50 w-full border-b bg-background/95 backdrop-blur transition-all duration-200 supports-[backdrop-filter]:bg-background/60"
>
	<div class="container flex h-16 w-full items-center justify-between gap-4">
		<!-- Logo and Locatio`n -->
		<div class="flex items-center gap-4">
			<a href="/" class="flex items-center space-x-2">
				<span class="text-xl font-bold text-primary">Azumi</span>
			</a>
			{#if activeLocation.current.lat != 0 && activeLocation.current.lng != 0}
				<button
					class="group flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
					aria-label="Change location"
					onclick={() => {
						addDeliveryAddressModalState.setTrue();
					}}
				>
					<MapPin class="h-4 w-4" />
					<span class="max-w-[200px] truncate border border-red-600"
						>{activeLocation.current.name}</span
					>
					<ChevronDown class="h-4 w-4 transition-transform group-hover:rotate-180" />
				</button>
			{/if}
		</div>
		<LoginModal />
		<RegisterModal />
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
			<!-- Order Sheet Button -->
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
							<Button
								variant="ghost"
								class="relative h-9 w-9 rounded-full p-0 hover:bg-muted/80"
								aria-label="User menu"
							>
								<Avatar class="h-9 w-9">
									<AvatarImage src={user.image} alt={user.name || 'User'} />
									<AvatarFallback>
										{user?.name
											?.split(' ')
											.map((n) => n.charAt(0))
											.join('')
											.toUpperCase() ?? ''}
									</AvatarFallback>
								</Avatar>
							</Button>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content class="w-56" align="end">
							<DropdownMenu.Label>My Account</DropdownMenu.Label>
							<DropdownMenu.Separator />
							<DropdownMenu.Item>
								<a href="/me/personal-info" class="flex w-full">Profile</a>
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								<a href="/me/orders" class="flex w-full">Orders</a>
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								<a href="/me/favorites" class="flex w-full">Favorites</a>
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								<a href="/me/settings" class="flex w-full">Settings</a>
							</DropdownMenu.Item>
							<DropdownMenu.Separator />
							{#if $organizations.isPending}
								<p>Loading...</p>
							{:else if $organizations.data === null}
								<span class="sr-only">no organizations</span>
							{:else}
								{#each $organizations.data as organization}
									<DropdownMenu.Item
										onclick={() => {
											authClient.organization.setActive({
												organizationSlug: organization.slug
											});
											goto('/vendor/menu');
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
									Sign out
								</button>
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
					<!-- <ResponsiveDropdown>
						{#snippet trigger()}
							<Button
								variant="ghost"
								class="relative h-9 w-9 rounded-full p-0 hover:bg-muted/80"
								aria-label="User menu"
							>
								<Avatar class="h-9 w-9">
									<AvatarImage src={user.image} alt={user.name || 'User'} />
									<AvatarFallback>
										{user?.name
											?.split(' ')
											.map((n) => n.charAt(0))
											.join('')
											.toUpperCase() ?? ''}
									</AvatarFallback>
								</Avatar>
							</Button>
						{/snippet}
						{#snippet children()}
							<div>
								<div class="dropdown-menu-label">My Account</div>
								<Separator />
								<a class="dropdown-menu-item" href="/me/personal-info"
									><User class="mr-2 h-4 w-4" />Profile</a
								>
								<a href="/me/orders" class="dropdown-menu-item"
									><Package class="mr-2 h-4 w-4" />Orders</a
								>
								<a href="/me/favorites" class="dropdown-menu-item"
									><Heart class="mr-2 h-4 w-4" />Favorites</a
								>
								<a href="/me/settings" class="dropdown-menu-item"
									><Settings class="mr-2 h-4 w-4" />Settings</a
								>
								<Separator />

								{#if $organizations.isPending}
									<p>Loading...</p>
								{:else if $organizations.data === null}
									<span class="sr-only">no organizations</span>
								{:else}
									{#each $organizations.data as organization}
										<button
											type="button"
											class="dropdown-menu-item"
											onclick={() => {
												authClient.organization.setActive({
													organizationSlug: organization.slug
												});
												goto('/vendor/menu');
											}}
										>
											<Store class="mr-2 h-4 w-4" />
											{organization.name}
										</button>
									{/each}
								{/if}

								<Separator />
								<button
									class="dropdown-menu-item text-red-500"
									onclick={async () => {
										authClient.signOut();
										await invalidateAll();
									}}
									type="button"
								>
									Sign out
								</button>
							</div>
						{/snippet}
					</ResponsiveDropdown> -->
				</nav>
			{:else}
				<div class="hidden items-center gap-2 md:flex">
					<Button onclick={() => loginModalState.setTrue()} variant="ghost" size="sm">Login</Button>
					<Button onclick={() => registerModalState.setTrue()} variant="default" size="sm"
						>Register</Button
					>
				</div>
			{/if}

			<!-- Mobile Menu Button -->
			<Button
				variant="ghost"
				size="icon"
				class="md:hidden"
				onclick={() => (isMobileMenuOpen = !isMobileMenuOpen)}
				aria-label="Menu"
			>
				<Menu class="h-5 w-5" />
			</Button>
		</div>
	</div>

	<!-- Mobile Search and Navigation -->
	{#if isMobileMenuOpen}
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
					<Button
						onclick={() => registerModalState.setTrue()}
						variant="default"
						class="justify-start">Register</Button
					>
				{/if}

				<Button variant="ghost" class="justify-start">
					<MapPin class="mr-2 h-4 w-4" />
					{location}
				</Button>
			</div>
		</div>
	{/if}
</header>
