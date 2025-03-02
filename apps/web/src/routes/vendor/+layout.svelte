<!-- <script lang="ts">

	import * as Sheet from '$lib/components/ui/sheet/index.js';

	
</script> -->

<script lang="ts">
	import CircleUser from 'lucide-svelte/icons/circle-user';
	import Menu from 'lucide-svelte/icons/menu';
	import Package2 from 'lucide-svelte/icons/package-2';
	import Search from 'lucide-svelte/icons/search';

	import { Button } from '$lib/components/ui/button/index.js';

	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	let { children } = $props();
	import * as Sidebar from '$lib/components/ui/sidebar';
	import VendorSidebar from '$lib/components/VendorSidebar.svelte';

	let data = {
		user: {
			name: 'John Doe',
			profile_picture: 'https://avatars.githubusercontent.com/u/15007104?v=4'
		}
	};
</script>

<Sidebar.Provider>
	<VendorSidebar />
	<Sidebar.Inset>
		<Sidebar.Trigger />
		<main class="w-full max-w-6xl md:px-5">
			{@render children()}
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>

<!-- <div class="flex min-h-screen w-full flex-col">
	<header
		class="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6"
	>
		<nav
			class="hidden w-full flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6"
		>
			
			<a
				href="/seller/overview"
				class="text-muted-foreground transition-colors hover:text-foreground"
			>
				Overview
			</a>
			<a
				href="/seller/products"
				class="text-muted-foreground transition-colors hover:text-foreground"
			>
				Products
			</a>
			<a href="##" class="text-muted-foreground transition-colors hover:text-foreground">
				Orders
			</a>
			<a href="##" class="text-muted-foreground transition-colors hover:text-foreground">
				Customers
			</a>
			<a href="/seller/settings" class="text-foreground transition-colors hover:text-foreground">
				Settings
			</a>
		</nav>
		<Sheet.Root>
			<Sheet.Trigger>
				<Button variant="outline" size="icon" class="shrink-0 md:hidden">
					<Menu class="h-5 w-5" />
					<span class="sr-only">Toggle navigation menu</span>
				</Button>
			</Sheet.Trigger>
			<Sheet.Content side="left">
				<nav class="grid gap-6 text-lg font-medium">
					<a href="##" class="flex items-center gap-2 text-lg font-semibold">
						<Package2 class="h-6 w-6" />
						<span class="sr-only">Acme Inc</span>
					</a>
					<a href="##" class="text-muted-foreground hover:text-foreground"> Overview </a>
					<a href="##" class="text-muted-foreground hover:text-foreground"> Products </a>
					<a href="##" class="text-muted-foreground hover:text-foreground"> Orders </a>
					<a href="##" class="text-muted-foreground hover:text-foreground"> Customers </a>
					<a href="##" class="hover:text-foreground"> Settings </a>
				</nav>
			</Sheet.Content>
		</Sheet.Root>
		<div class="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
			<form class="ml-auto flex-1 sm:flex-initial">
				<div class="relative">
					<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search products..."
						class="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
					/>
				</div>
			</form>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					<Button variant="secondary" size="icon" class="rounded-full">
						{#if data.user.profile_picture}
							<img
								src={data.user.profile_picture}
								class="h-full w-full rounded-full border-2 border-primary"
								alt=""
							/>
						{:else}
							<CircleUser class="h-5 w-5" />
						{/if}
						<span class="sr-only">Toggle user menu</span>
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end">
					<DropdownMenu.Label>My Account</DropdownMenu.Label>
					<DropdownMenu.Separator />
					<DropdownMenu.Item>Settings</DropdownMenu.Item>
					<DropdownMenu.Item>Support</DropdownMenu.Item>
					<DropdownMenu.Separator />
					<DropdownMenu.Item>Logout</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</header>
	<slot />
</div> -->
