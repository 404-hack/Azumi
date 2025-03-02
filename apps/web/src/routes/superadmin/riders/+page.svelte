<script lang="ts">
	import { adminState } from '$lib/states/adminState.svelte';
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

	let searchQuery = $state('');
	let selectedTab = $state('all');

	// Mock data for pending applications
	const pendingApplications = [
		{
			id: 'APP-001',
			name: 'John Smith',
			phone: '+234 123 456 7890',
			vehicleType: 'motorcycle',
			location: 'Lagos',
			appliedDate: new Date('2024-02-01'),
			documents: [
				{ type: 'license', status: 'verified' },
				{ type: 'insurance', status: 'pending' }
			]
		},
		{
			id: 'APP-002',
			name: 'Mary Johnson',
			phone: '+234 123 456 7891',
			vehicleType: 'bicycle',
			location: 'Abuja',
			appliedDate: new Date('2024-02-02'),
			documents: [
				{ type: 'license', status: 'verified' },
				{ type: 'insurance', status: 'verified' }
			]
		}
	];

	let filteredRiders = $derived(
		adminState.activeRiders.filter((rider) => {
			const matchesSearch = rider.name.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesTab =
				selectedTab === 'all' ||
				(selectedTab === 'online' && rider.status === 'available') ||
				(selectedTab === 'offline' && rider.status === 'offline');
			return matchesSearch && matchesTab;
		})
	);

	function handleRiderAction(riderId: string, action: 'suspend' | 'activate' | 'delete') {
		if (action === 'suspend') {
			adminState.suspendRider(riderId);
		}
		// Implement other actions
	}

	function handleApplicationAction(applicationId: string, approved: boolean) {
		adminState.reviewRiderApplication(applicationId, approved);
	}

	function getStatusBadgeVariant(
		status: RiderProfile['status']
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status) {
			case 'available':
				return 'default';
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

	function getStatusLabel(status: RiderProfile['status']): string {
		switch (status) {
			case 'available':
				return 'Online';
			case 'on_delivery':
				return 'On Delivery';
			case 'offline':
				return 'Offline';
			case 'break':
				return 'On Break';
			default:
				return status;
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
							<Table.Head>Location</Table.Head>
							<Table.Head>Applied Date</Table.Head>
							<Table.Head>Documents</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each pendingApplications as application}
							<Table.Row>
								<Table.Cell class="font-medium">{application.name}</Table.Cell>
								<Table.Cell class="capitalize">{application.vehicleType}</Table.Cell>
								<Table.Cell>{application.location}</Table.Cell>
								<Table.Cell>{formatDate(application.appliedDate)}</Table.Cell>
								<Table.Cell>
									<Badge variant={application.documentsVerified ? 'default' : 'secondary'}>
										{application.documentsVerified ? 'Verified' : 'Pending'}
									</Badge>
								</Table.Cell>
								<Table.Cell class="text-right">
									<div class="flex items-center justify-end gap-2">
										<Button
											variant="outline"
											size="sm"
											onclick={() => handleApplicationAction(application.id, false)}
										>
											Reject
										</Button>
										<Button
											variant="outline"
											size="sm"
											href="/superadmin/riders/application/{application.id}"
										>
											View
										</Button>
										<Button size="sm" onclick={() => handleApplicationAction(application.id, true)}>
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
					</Table.Header>
					<Table.Body>
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
											<div class="text-sm text-muted-foreground">ID: {rider.id}</div>
										</div>
									</div>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<Bike class="h-4 w-4 text-muted-foreground" />
										<span class="capitalize">{rider.vehicleType}</span>
									</div>
								</Table.Cell>
								<Table.Cell>{rider.totalDeliveries}</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-1">
										<Star class="h-4 w-4 fill-yellow-400 text-yellow-400" />
										<span>{rider.rating.toFixed(1)}</span>
									</div>
								</Table.Cell>
								<Table.Cell>
									<Badge variant={getStatusBadgeVariant(rider.status)}>
										{getStatusLabel(rider.status)}
									</Badge>
								</Table.Cell>
								<Table.Cell>{formatDate(rider.joinedDate)}</Table.Cell>
								<Table.Cell class="text-right">
									<DropdownMenu.Root>
										<DropdownMenu.Trigger>
											<Button variant="ghost" size="icon">
												<MoreVertical class="h-4 w-4" />
												<span class="sr-only">Actions</span>
											</Button>
										</DropdownMenu.Trigger>
										<DropdownMenu.Content align="end">
											<DropdownMenu.Item href="/superadmin/riders/{rider.id}">
												View Profile
											</DropdownMenu.Item>
											<DropdownMenu.Item href="/superadmin/riders/{rider.id}/documents">
												View Documents
											</DropdownMenu.Item>
											<DropdownMenu.Separator />
											<DropdownMenu.Item
												class="text-red-600"
												onclick={() => handleRiderAction(rider.id, 'suspend')}
											>
												Suspend Rider
											</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</div>
	</Card>
</div>
