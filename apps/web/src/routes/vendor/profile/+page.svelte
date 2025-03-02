<script lang="ts">
	import { Bell, ChevronRight, LogOut, Settings, User, Edit2 } from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import TodoList from '$lib/components/vendor/TodoList.svelte';
	import QuickLinks from '$lib/components/vendor/QuickLinks.svelte';

	let profileCompletion = $state(65);
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
					<h2 class="text-2xl font-bold">Tasty Bites Restaurant</h2>
					<p class="text-sm text-muted-foreground">123 Foodie Street, Flavor Town, FT 12345</p>
				</div>
				<Button variant="outline" size="sm" class="flex items-center" href="/vendor/profile/edit">
					<Edit2 class="mr-2 h-4 w-4" />
					Edit Profile
				</Button>
			</div>
			<div class="mt-6">
				<div class="mb-2 flex items-center justify-between">
					<h3 class="text-sm font-medium">Profile Completion</h3>
					<span class="text-sm font-medium text-primary">{profileCompletion}%</span>
				</div>
				<Progress value={profileCompletion} class="h-2" />
			</div>
		</Card.Content>
	</Card.Root>

	<div class="grid gap-6 md:grid-cols-2">
		<Card.Root>
			<Card.Content class="p-6">
				<h3 class="mb-4 text-xl font-semibold">To-Do Before Going Live</h3>
				<TodoList />
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Content class="p-6">
				<h3 class="mb-4 text-xl font-semibold">Quick Links</h3>
				<QuickLinks />
			</Card.Content>
		</Card.Root>
	</div>
</div>
