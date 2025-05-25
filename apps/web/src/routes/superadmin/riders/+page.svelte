<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Input } from '$lib/components/ui/input';
	import { Search, Bike, Star, MoreVertical, AlertCircle, MapPin, Clock } from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { formatCurrency, formatDate } from '$lib/utils';
	import type { RiderProfile } from '$lib/types/rider';
	import type { PageData } from './$types';
	import { client } from '$lib/hc';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';	
	import { goto } from '$app/navigation';
	
	/** @type {import('./$types').PageData} */
	const { data } = $props();
	
	let searchQuery = $state('');
	let selectedTab = $state('all');
	let isLoading = $state(false);	// Use real data from the load function
	let riders = $state(data.riders);
	let pendingApplications = $state(data.pendingApplications);
	
	// Add computed fields for easier display
	let mappedRiders = $state(data.riders.map(rider => ({
		...rider,
		name: rider.firstName && rider.lastName ? 
			`${rider.firstName} ${rider.lastName}` : 
			rider.firstName || rider.lastName || rider.email || 'No Name',
		status: rider.availabilityStatus?.toLowerCase() || 'offline',
		rating: rider.rating || 0,
		joinedDate: rider.createdAt ? new Date(rider.createdAt) : new Date(),
		totalDeliveries: 0 // Add this field from future API data if available
	})));

	// Filtered riders list
	let filteredRiders = $derived(
		mappedRiders.filter((rider) => {
			const matchesSearch = 
				rider.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
				(rider.email && rider.email.toLowerCase().includes(searchQuery.toLowerCase()));
			const matchesTab =
				selectedTab === 'all' ||
				(selectedTab === 'online' && rider.availabilityStatus === 'ONLINE') ||
				(selectedTab === 'offline' && rider.availabilityStatus === 'OFFLINE');
			return matchesSearch && matchesTab;
		})
	);
	async function handleRiderAction(riderId: string, action: 'suspend' | 'activate' | 'delete') {
		isLoading = true;
		try {
			if (action === 'suspend' || action === 'activate') {
				const active = action === 'activate';
				const res = await client.admin.riders[':id'].status.$patch({
					param: { id: riderId },
					json: { active }
				});
				
				if (res.ok) {
					toast.success(`Rider ${active ? 'activated' : 'suspended'} successfully`);
					invalidateAll();
				} else {
					toast.error(`Failed to ${active ? 'activate' : 'suspend'} rider`);
				}
			} else if (action === 'delete') {
				if (confirm('Are you sure you want to delete this rider? This action cannot be undone.')) {
					const res = await client.admin.riders[':id'].$delete({
						param: { id: riderId }
					});
					
					if (res.ok) {
						toast.success('Rider deleted successfully');
						// Remove from local state
						riders = riders.filter(r => r.id !== riderId);
						mappedRiders = mappedRiders.filter(r => r.id !== riderId);
					} else {
						toast.error('Failed to delete rider');
					}
				}
			}
		} catch (error) {
			toast.error(`Error: ${error.message || 'Unknown error occurred'}`);
		} finally {
			isLoading = false;
		}
	}

	async function handleApplicationAction(applicationId: string, approved: boolean) {
		isLoading = true;
		try {
			const newStatus = approved ? 'APPROVED' : 'REJECTED';
			const res = await client.admin.riders[':id'].status.$patch({
				param: { id: applicationId },
				json: { 
					applicationStatus: newStatus,
					active: approved
				}
			});
			
			if (res.ok) {
				toast.success(`Application ${approved ? 'approved' : 'rejected'} successfully`);
				// Remove from pending applications
				pendingApplications = pendingApplications.filter(app => app.id !== applicationId);
				invalidateAll();
			} else {
				toast.error(`Failed to ${approved ? 'approve' : 'reject'} application`);
			}
		} catch (error) {
			toast.error(`Error: ${error.message || 'Unknown error occurred'}`);
		} finally {
			isLoading = false;
		}
	}

	function getStatusBadgeVariant(
		status: string
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status?.toLowerCase()) {
			case 'online':
			case 'available':
				return 'default';
			case 'busy':
			case 'on_delivery':
				return 'secondary';
			case 'offline':
				return 'outline';
			case 'break':
				return 'secondary';
			default:
				return 'outline';
		}
	}

	function getStatusLabel(status: string): string {
		switch (status?.toLowerCase()) {
			case 'online':
			case 'available':
				return 'Online';
			case 'busy':
			case 'on_delivery':
				return 'On Delivery';
			case 'offline':
				return 'Offline';
			case 'break':
				return 'On Break';
			default:
				return status || 'Unknown';
		}
	}
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-bold">Riders Management</h2>
		<Button href="/superadmin/riders/new">Add New Rider</Button>
	</div>
	<!-- Pending Applications -->
	{#if pendingApplications.length > 0}
		<Card class="p-6">
			<div class="mb-6 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<AlertCircle class="h-5 w-5 text-yellow-500" />
					<h3 class="font-semibold">Pending Applications</h3>
				</div>
				<Badge variant="outline">{pendingApplications.length} new</Badge>
			</div>
			<div class="overflow-auto">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Name</Table.Head>
							<Table.Head>Vehicle Type</Table.Head>
							<Table.Head>Contact</Table.Head>
							<Table.Head>Applied Date</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each pendingApplications as application}
							{@const fullName = `${application.firstName || ''} ${application.lastName || ''}`.trim() || application.email || 'No Name'}
							<Table.Row>
								<Table.Cell class="font-medium">{fullName}</Table.Cell>
								<Table.Cell class="capitalize">{application.vehicleType || 'Not specified'}</Table.Cell>
								<Table.Cell>{application.email || 'No contact'}</Table.Cell>
								<Table.Cell>
									{application.createdAt ? formatDate(new Date(application.createdAt)) : 'Unknown'}
								</Table.Cell>
								<Table.Cell>
									<Badge variant={application.isVerified ? 'default' : 'secondary'}>
										{application.isVerified ? 'Docs Verified' : 'Docs Pending'}
									</Badge>
								</Table.Cell>
								<Table.Cell class="text-right">
									<div class="flex items-center justify-end gap-2">
										<Button
											variant="outline"
											size="sm"
											disabled={isLoading}
											onclick={() => handleApplicationAction(application.id, false)}
										>
											Reject
										</Button>
										<Button
											variant="outline"
											size="sm"
											href="/superadmin/riders/{application.id}"
										>
											View
										</Button>
										<Button 
											size="sm" 
											disabled={isLoading}
											onclick={() => handleApplicationAction(application.id, true)}
										>
											Approve
										</Button>
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</Card>
	{/if}

	<!-- Riders List -->
	<Card class="p-6">
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<Tabs.Root value={selectedTab} class="w-[400px]" onValueChange={(v) => (selectedTab = v)}>
					<Tabs.List>
						<Tabs.Trigger value="all">All Riders</Tabs.Trigger>
						<Tabs.Trigger value="online">Online</Tabs.Trigger>
						<Tabs.Trigger value="offline">Offline</Tabs.Trigger>
					</Tabs.List>
				</Tabs.Root>
				<div class="relative">
					<Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input placeholder="Search riders..." class="pl-8" bind:value={searchQuery} />
				</div>
			</div>

			<div class="rounded-md border">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Rider</Table.Head>
							<Table.Head>Vehicle</Table.Head>
							<Table.Head>Total Deliveries</Table.Head>
							<Table.Head>Rating</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head>Joined</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>					<Table.Body>
						{#if filteredRiders.length === 0}
							<Table.Row>
								<Table.Cell colspan="7" class="py-10 text-center text-muted-foreground">
									No riders found matching your filters.
								</Table.Cell>
							</Table.Row>
						{:else}
							{#each filteredRiders as rider}
								<Table.Row>
									<Table.Cell>
										<div class="flex items-center gap-2">
											<div class="h-8 w-8 overflow-hidden rounded-full bg-muted">
												<img
													src="https://api.dicebear.com/7.x/avataaars/svg?seed={rider.name}"
													alt="{rider.name}'s avatar"
													class="h-full w-full"
												/>
											</div>
											<div>
												<div class="font-medium">{rider.name}</div>
												<div class="text-sm text-muted-foreground">
													{rider.email || 'No email'}
												</div>
											</div>
										</div>
									</Table.Cell>
									<Table.Cell>
										<div class="flex items-center gap-2">
											<Bike class="h-4 w-4 text-muted-foreground" />
											<span class="capitalize">{rider.vehicleType || 'Not specified'}</span>
										</div>
									</Table.Cell>
									<Table.Cell>{rider.totalDeliveries || 0}</Table.Cell>
									<Table.Cell>
										<div class="flex items-center gap-1">
											<Star class="h-4 w-4 fill-yellow-400 text-yellow-400" />
											<span>{(rider.rating || 0).toFixed(1)} ({rider.totalRatings || 0})</span>
										</div>
									</Table.Cell>
									<Table.Cell>
										<Badge variant={getStatusBadgeVariant(rider.availabilityStatus)}>
											{getStatusLabel(rider.availabilityStatus)}
										</Badge>
										{#if rider.active === false}
											<Badge variant="destructive" class="ml-1">Suspended</Badge>
										{/if}
									</Table.Cell>
									<Table.Cell>
										{rider.createdAt ? formatDate(new Date(rider.createdAt)) : 'Unknown'}
									</Table.Cell>
									<Table.Cell class="text-right">
										<DropdownMenu.Root>
											<DropdownMenu.Trigger>
												<Button variant="ghost" size="icon" disabled={isLoading}>
													<MoreVertical class="h-4 w-4" />
													<span class="sr-only">Actions</span>
												</Button>
											</DropdownMenu.Trigger>
											<DropdownMenu.Content align="end">
												<DropdownMenu.Item onclick={() => goto(`/superadmin/riders/${rider.id}`)}>
													View Profile
												</DropdownMenu.Item>
												{#if rider.vehicleLicense || rider.identificationDocument}
													<DropdownMenu.Item href="/superadmin/riders/{rider.id}#documents">
														View Documents
													</DropdownMenu.Item>
												{/if}
												<DropdownMenu.Separator />
												{#if rider.active}
													<DropdownMenu.Item
														class="text-red-600"
														onclick={() => handleRiderAction(rider.id, 'suspend')}
													>
														Suspend Rider
													</DropdownMenu.Item>
												{:else}
													<DropdownMenu.Item
														class="text-green-600"
														onclick={() => handleRiderAction(rider.id, 'activate')}
													>
														Activate Rider
													</DropdownMenu.Item>
												{/if}
												<DropdownMenu.Item
													class="text-red-600"
													onclick={() => handleRiderAction(rider.id, 'delete')}
												>
													Delete Rider
												</DropdownMenu.Item>
											</DropdownMenu.Content>
										</DropdownMenu.Root>
									</Table.Cell>
								</Table.Row>
							{/each}
						{/if}
					</Table.Body>
				</Table.Root>
			</div>
		</div>
	</Card>
</div>
