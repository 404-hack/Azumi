<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		loginModalState,
		orderSheetStore,
		registerModalState
	} from '$lib/states/modalState.svelte';
	import CartSheet from './modal/CartSheet.svelte';
	import OrderSheet from './modal/OrderSheet.svelte';
	import { MapPin, Search, ShoppingBag, ChevronDown } from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import LoginModal from './modal/LoginModal.svelte';
	import RegisterModal from './modal/RegisterModal.svelte';
	import { onMount } from 'svelte';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	import { page } from '$app/state';
	import { authClient } from '$lib/auth-client';
	import { invalidateAll } from '$app/navigation';
	let location = 'Nairobi, Kenya';
	let searchQuery = '';

	let user = $derived(page.data.user);
</script>

<header
	class=" top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
	<div class="container grid h-16 w-full grid-cols-3 gap-3">
		<div class="flex items-center gap-6">
			<a href="/" class="hidden items-center space-x-2 md:flex">
				<span class="text-xl font-bold text-primary">AMO</span>
			</a>

			<button
				class="hidden items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary md:flex"
			>
				<MapPin class="h-4 w-4" />
				<span>{location}</span>
				<ChevronDown class="h-4 w-4" />
			</button>
		</div>

		<div class="flex flex-1 items-center justify-end space-x-4 md:justify-between">
			<div class="hidden w-full max-w-xl md:flex">
				<div class="relative w-full">
					<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search restaurants or dishes..."
						class="w-full pl-10 pr-4"
						bind:value={searchQuery}
					/>
				</div>
			</div>
		</div>
		<!-- <form
			class="flex h-fit w-full items-center justify-between rounded-3xl bg-muted px-3.5 focus-within:ring-2 focus-within:ring-primary"
		>
			<input
				type="search"
				bind:value={searchQuery}
				placeholder="Search menu..."
				class="h-11 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
				name=""
				id=""
			/>
			<Search class="text-muted-foreground" />
		</form> -->
		<div>
			{#if user}
				<nav class="flex items-center justify-end gap-4">
					<CartSheet />

					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							<Button variant="ghost" class="relative h-8 w-8 rounded-full">
								<Avatar class="h-8 w-8">
									<AvatarImage src={user.image} alt="User profile" />
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
							<DropdownMenu.Separator />
							<DropdownMenu.Item>
								<a href="/me/settings" class="flex w-full">Settings</a>
							</DropdownMenu.Item>
							<DropdownMenu.Item class="text-red-500">
								<button
									onclick={async () => {
										authClient.signOut();
										await invalidateAll();
									}}
									class="flex w-full">Sign out</button
								>
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</nav>
			{:else}
				<div class="hidden items-center justify-end gap-2 md:flex">
					<Button onclick={() => loginModalState.setTrue()} variant="ghost">Login</Button>
					<Button onclick={() => registerModalState.setTrue()}>Register</Button>
				</div>
			{/if}
		</div>

		<!-- <button
			onclick={() => {
				mobileAuthState.setTrue();
			}}
			class="flex size-10 items-center justify-center rounded-full hover:bg-secondary md:hidden"
		>
			<Menu class="size-6 " />
		</button> -->
	</div>
</header>

<LoginModal />
<RegisterModal />
