<script lang="ts">
	import { Bell, ChevronRight, LogOut, Settings, User, Edit2, Clock, CheckCircle2, ListTodo, ShoppingBag, BarChart, Truck } from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import TodoList from '$lib/components/vendor/TodoList.svelte';
	import QuickLinks from '$lib/components/vendor/QuickLinks.svelte';

	let profileCompletion = $state(65);
	let { data } = $props();
	$inspect(data);
</script>

<div class="space-y-6">
	<Card.Root class="overflow-hidden">
		<div class="relative h-32 bg-gradient-to-r from-primary to-secondary">
			<div class="absolute -bottom-12 left-6">
				<div class="relative h-24 w-24 overflow-hidden rounded-full border-4 border-background">
					<img src="/placeholder.svg" alt="Vendor Logo" class="h-full w-full object-cover" />
				</div>
			</div>

			<div class="absolute right-4 top-4">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						<Button variant="ghost" size="icon" class="bg-white/20 hover:bg-white/30">
							<Settings class="h-5 w-5 text-white" />
							<span class="sr-only">Open menu</span>
						</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end" class="w-56">
						<DropdownMenu.Label>Actions</DropdownMenu.Label>
						<DropdownMenu.Item>
							<User class="mr-2 h-4 w-4" />
							<span>Edit Profile</span>
						</DropdownMenu.Item>
						<DropdownMenu.Item>
							<Bell class="mr-2 h-4 w-4" />
							<span>Notification Settings</span>
						</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<DropdownMenu.Item class="text-destructive">
							<LogOut class="mr-2 h-4 w-4" />
							<span>Log out</span>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		</div>
		<Card.Content class="pb-6 pt-16">
			<div class="mb-4 flex items-end justify-between">
				<div>
					<h2 class="text-2xl font-bold">{data.profile.name}</h2>
					<p class="text-sm text-muted-foreground">{data.profile.description}</p>
				</div>
				<Button variant="outline" size="sm" class="flex items-center" href="/vendor/profile/edit">
					<Edit2 class="mr-2 h-4 w-4" />
					Edit Profile
				</Button>
			</div>
			<div class="mt-6">
				<div class="mb-2 flex items-center justify-between">
					<h3 class="text-sm font-medium">Profile Completion</h3>
					<span class="text-sm font-medium text-primary">{data.profile.profileCompletion}%</span>
				</div>
				<Progress value={data.profile.profileCompletion} class="h-2" />
			</div>
		</Card.Content>
	</Card.Root>

	<div class="grid gap-6 md:grid-cols-2">
		{#if data.profile.status === 'PENDING'}
			<Card.Root>
				<Card.Content class="p-6">
					<div class="flex flex-col items-center text-center">
						<div class="mb-6 rounded-full bg-orange-100 p-4">
							<Clock class="h-8 w-8 text-orange-500" />
						</div>
						<h3 class="mb-2 text-xl font-semibold text-orange-500">Activation Pending</h3>
						<p class="text-muted-foreground">Your activation request is currently being reviewed. We'll notify you once it's approved.</p>
						<div class="mt-6 flex items-center gap-2">
							<div class="h-2 w-2 animate-pulse rounded-full bg-orange-500"></div>
							<span class="text-sm text-orange-500">Review in progress</span>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		{:else if data.profile.status === 'APPROVED'}
			<Card.Root>
				<Card.Content class="p-6">
					<div class="relative">
						<div class="mb-6 flex items-center justify-center">
							<div class="rounded-full bg-green-100 p-4">
								<CheckCircle2 class="h-8 w-8 text-green-500" />
							</div>
						</div>
						<h3 class="mb-4 text-center text-xl font-semibold text-green-500">Account Active</h3>
						<p class="mb-6 text-center text-muted-foreground">Your account is active. You can now access these features:</p>
						<div class="grid gap-4">
							<div class="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
								<div class="rounded-md bg-primary/10 p-2">
									<ShoppingBag class="h-5 w-5 text-primary" />
								</div>
								<div class="flex-1">
									<h4 class="text-sm font-medium">Manage Products</h4>
									<p class="text-xs text-muted-foreground">Add and manage your inventory</p>
								</div>
								<ChevronRight class="h-5 w-5 text-muted-foreground" />
							</div>
							<div class="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
								<div class="rounded-md bg-primary/10 p-2">
									<Truck class="h-5 w-5 text-primary" />
								</div>
								<div class="flex-1">
									<h4 class="text-sm font-medium">Process Orders</h4>
									<p class="text-xs text-muted-foreground">Handle orders and shipments</p>
								</div>
								<ChevronRight class="h-5 w-5 text-muted-foreground" />
							</div>
							<div class="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
								<div class="rounded-md bg-primary/10 p-2">
									<BarChart class="h-5 w-5 text-primary" />
								</div>
								<div class="flex-1">
									<h4 class="text-sm font-medium">Analytics</h4>
									<p class="text-xs text-muted-foreground">View reports and insights</p>
								</div>
								<ChevronRight class="h-5 w-5 text-muted-foreground" />
							</div>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		{:else}
			<Card.Root>
				<Card.Content class="p-6">
					<div class="flex items-center justify-between mb-4">
						<div class="flex items-center gap-3">
							<div class="rounded-full bg-primary/10 p-2">
								<ListTodo class="h-6 w-6 text-primary" />
							</div>
							<h3 class="text-xl font-semibold">To-Do Before Going Live</h3>
						</div>
					</div>
					<TodoList todos={data.profile.todo} />
				</Card.Content>
			</Card.Root>
		{/if}

		<Card.Root>
			<Card.Content class="p-6">
				<h3 class="mb-4 text-xl font-semibold">Quick Links</h3>
				<QuickLinks />
			</Card.Content>
		</Card.Root>
	</div>
</div>
