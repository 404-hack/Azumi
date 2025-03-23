<script lang="ts">
	import { Users, UserPlus, Shield, Mail, Search } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Badge } from '$lib/components/ui/badge';
	import { authClient } from '$lib/auth-client';
	import InviteUserButton from '$lib/components/InviteUserButton.svelte';
	const roles = {
		OWNER: 'Owner',
		MANAGER: 'Manager',
		STAFF: 'Staff'
	};

	let searchQuery = $state('');
	let { data } = $props();
	const users = $derived(data?.shopInfo?.data?.members);

	function inviteUser() {
		// Implement invite user functionality
		console.log('Invite user clicked');
	}

	function updateUserRole(userId: number, newRole: string) {
		// Implement role update functionality
		console.log('Update user role:', userId, newRole);
	}

	function removeUser(userId: number) {
		// Implement remove user functionality
		console.log('Remove user:', userId);
	}

	let filteredUsers = $derived(
		users.filter(
			({ user }) =>
				user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				user.email.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);
</script>

<div class="container mx-auto space-y-6 p-4">
	<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
		<h1 class="text-3xl font-bold">Manage Users</h1>

		<InviteUserButton />
	</div>

	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center">
				<Users class="mr-2 h-5 w-5" />
				Store Staff
			</Card.Title>
			<Card.Description>Manage your store's team members and their permissions</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="space-y-4">
				<div class="relative">
					<Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input type="text" placeholder="Search users..." class="pl-8" bind:value={searchQuery} />
				</div>

				<div class="rounded-md border">
					<div class="grid grid-cols-12 gap-4 border-b p-4 font-medium">
						<div class="col-span-5">User</div>
						<div class="col-span-3">Role</div>
						<div class="col-span-2">Status</div>
						<div class="col-span-2">Actions</div>
					</div>

					{#each filteredUsers as { user, role }}
						<div class="grid grid-cols-12 gap-4 border-b p-4 last:border-0">
							<div class="col-span-5">
								<div class="flex flex-col">
									<span class="font-medium">{user.name}</span>
									<span class="text-sm text-muted-foreground">{user.email}</span>
								</div>
							</div>
							<div class="col-span-3">
								<Badge
									variant={role === roles.OWNER
										? 'default'
										: role === roles.MANAGER
											? 'secondary'
											: 'outline'}
								>
									{role}
								</Badge>
							</div>
							<div class="col-span-2">
								<!-- <Badge variant={status === 'active' ? 'success' : 'warning'} class="capitalize">
									{status}
								</Badge> -->
							</div>
							<div class="col-span-2">
								<DropdownMenu.Root>
									<DropdownMenu.Trigger>
										<Button variant="ghost" size="sm">
											Actions
											<Shield class="ml-2 h-4 w-4" />
										</Button>
									</DropdownMenu.Trigger>
									<DropdownMenu.Content>
										{#if user.role !== roles.OWNER}
											<DropdownMenu.Label>Change Role</DropdownMenu.Label>
											{#each Object.values(roles) as role}
												{#if role !== roles.OWNER && role !== user.role}
													<DropdownMenu.Item onclick={() => updateUserRole(user.id, role)}>
														Make {role}
													</DropdownMenu.Item>
												{/if}
											{/each}
											<DropdownMenu.Separator />
											<DropdownMenu.Item
												class="text-destructive"
												onclick={() => removeUser(user.id)}
											>
												Remove User
											</DropdownMenu.Item>
										{/if}
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</Card.Content>
	</Card.Root>
</div>
