<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import * as Tabs from '$lib/components/ui/tabs';
	import {
		Bike,
		MapPin,
		Phone,
		Mail,
		Clock,
		Star,
		ShoppingBag,
		DollarSign,
		FileText,
		AlertTriangle
	} from 'lucide-svelte';
	import { formatCurrency, formatDate, formatTime } from '$lib/utils';

	let { data } = $props();
	const  rider  = $derived(data.rider);

	const recentDeliveries = [
		{
			id: 'DEL-001',
			orderId: 'ORD-001',
			customerName: 'Alice Johnson',
			vendorName: 'Restaurant ABC',
			status: 'completed',
			earnings: 12.5,
			completedAt: new Date('2024-02-01T10:30:00')
		},
		{
			id: 'DEL-002',
			orderId: 'ORD-002',
			customerName: 'Bob Wilson',
			vendorName: 'Restaurant XYZ',
			status: 'completed',
			earnings: 15.0,
			completedAt: new Date('2024-02-01T11:45:00')
		}
	];

	let selectedTab = $state('overview');
	function getStatusBadgeVariant(
		status: boolean
	): 'default' | 'destructive' | 'outline' {
		return status ? 'default' : 'destructive';
	}

	function getApplicationStatusBadgeVariant(
		status: string
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status) {
			case 'APPROVED':
				return 'default';
			case 'PENDING':
				return 'secondary';
			case 'REJECTED':
				return 'destructive';
			default:
				return 'outline';
		}
	}

	function getAvailabilityStatusBadgeVariant(
		status: string
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status) {
			case 'ONLINE':
				return 'default';
			case 'BUSY':
				return 'secondary';
			case 'OFFLINE':
				return 'outline';
			default:
				return 'outline';
		}
	}
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<div class="space-y-1">
			<h2 class="text-2xl font-bold">Rider Profile</h2>
			<p class="text-muted-foreground">Manage rider information and performance</p>
		</div>
		<div class="flex items-center gap-4">
			<Button variant="outline" onclick={() => history.back()}>Back</Button>
			{#if rider.status !== 'offline'}
				<Button variant="destructive">Suspend Rider</Button>
			{:else}
				<Button variant="default">Activate Rider</Button>
			{/if}
		</div>
	</div>

	<!-- Rider Overview -->
	<div class="grid gap-6 md:grid-cols-[300px_1fr]">
		<Card class="p-6">
			<div class="space-y-6">
				<div class="flex flex-col items-center space-y-4">
					<div class="h-20 w-20 overflow-hidden rounded-full bg-muted">
						<img
							src="https://api.dicebear.com/7.x/avataaars/svg?seed={rider.name}"
							alt="{rider.name}'s avatar"
							class="h-full w-full"
						/>
					</div>					<div class="text-center">
						<h3 class="font-semibold">{rider.firstName} {rider.lastName}</h3>
						<p class="text-sm capitalize text-muted-foreground">{rider.vehicleType} Rider</p>
					</div>
					<div class="flex gap-2 flex-wrap justify-center">
						<Badge variant={getAvailabilityStatusBadgeVariant(rider.availabilityStatus)}>
							{rider.availabilityStatus}
						</Badge>
						<Badge variant={getStatusBadgeVariant(rider.active)}>
							{rider.active ? 'Active' : 'Inactive'}
						</Badge>
						<Badge variant={getStatusBadgeVariant(rider.isVerified)}>
							{rider.isVerified ? 'Verified' : 'Unverified'}
						</Badge>
						<Badge variant={getApplicationStatusBadgeVariant(rider.applicationStatus)}>
							{rider.applicationStatus}
						</Badge>
					</div>
				</div>

				<div class="space-y-2">
					<div class="flex items-center gap-2">
						<MapPin class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm">{rider.address} ({rider.addressName})</span>
					</div>
					<div class="flex items-center gap-2">
						<Phone class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm">{rider.user?.phoneNumber}</span>
					</div>
					<div class="flex items-center gap-2">
						<Mail class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm">{rider.email}</span>
					</div>
					<div class="flex items-center gap-2">
						<Clock class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm">Created at {formatDate(rider.createdAt)}</span>
					</div>
				</div>				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-sm text-muted-foreground">Rating</span>
						<div class="flex items-center gap-1">
							<Star class="h-4 w-4 fill-yellow-400 text-yellow-400" />
							<span class="font-medium">{rider.rating.toFixed(1)} ({rider.totalRatings} ratings)</span>
						</div>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-muted-foreground">Max Delivery Distance</span>
						<span class="font-medium">{rider.maxDeliveryDistance}km</span>
					</div>
				</div>
			</div>
		</Card>

		<div class="space-y-6">
			<Tabs.Root value={selectedTab} onValueChange={(v) => (selectedTab = v)}>
				<Tabs.List>
					<Tabs.Trigger value="overview">Overview</Tabs.Trigger>
					<Tabs.Trigger value="deliveries">Deliveries</Tabs.Trigger>
					<Tabs.Trigger value="documents">Documents</Tabs.Trigger>
					<Tabs.Trigger value="banking">Banking</Tabs.Trigger>
				</Tabs.List>
			</Tabs.Root>

			{#if selectedTab === 'overview'}
				<div class="grid gap-6">					<!-- Vehicle Information -->
					<Card class="p-6">
						<h3 class="mb-4 font-semibold">Vehicle Information</h3>
						<div class="grid gap-4">
							<div>
								<div class="text-sm text-muted-foreground">Vehicle Type</div>
								<div class="font-medium">{rider.vehicleType}</div>
							</div>
							<div>
								<div class="text-sm text-muted-foreground">Vehicle License</div>
								<div class="font-medium">{rider.vehicleLicense}</div>
							</div>
							<div>
								<div class="text-sm text-muted-foreground">Max Delivery Distance</div>
								<div class="font-medium">{rider.maxDeliveryDistance}km</div>
							</div>
						</div>
					</Card>

					<!-- Recent Deliveries -->
					<Card class="p-6">
						<div class="mb-4 flex items-center justify-between">
							<h3 class="font-semibold">Recent Deliveries</h3>
							<Button variant="ghost" size="sm">View All</Button>
						</div>
						<div class="rounded-lg border">
							<Table.Root>
								<Table.Header>
									<Table.Row>
										<Table.Head>Order ID</Table.Head>
										<Table.Head>Customer</Table.Head>
										<Table.Head>Vendor</Table.Head>
										<Table.Head>Completed</Table.Head>
										<Table.Head class="text-right">Earnings</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each recentDeliveries as delivery}
										<Table.Row>
											<Table.Cell class="font-medium">{delivery.orderId}</Table.Cell>
											<Table.Cell>{delivery.customerName}</Table.Cell>
											<Table.Cell>{delivery.vendorName}</Table.Cell>
											<Table.Cell>{formatTime(delivery.completedAt)}</Table.Cell>
											<Table.Cell class="text-right">{formatCurrency(delivery.earnings)}</Table.Cell
											>
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
						</div>
					</Card>
				</div>			{:else if selectedTab === 'documents'}
				<Card class="p-6">
					<h3 class="mb-4 font-semibold">Documents</h3>
				
				</Card>			{:else if selectedTab === 'banking'}
				<Card class="p-6">
					<h3 class="mb-4 font-semibold">Banking Information</h3>
					<div class="space-y-4">
						{#if rider.bankInfo}
							<div class="rounded-lg border p-4">
								<div class="mb-4 grid gap-2">
									<div>
										<div class="text-sm text-muted-foreground">Bank Name</div>
										<div class="font-medium">{rider.bankInfo.bankName}</div>
									</div>
									<div>
										<div class="text-sm text-muted-foreground">Account Number</div>
										<div class="font-medium">{rider.bankInfo.accountNumber}</div>
									</div>
									<div>
										<div class="text-sm text-muted-foreground">Account Name</div>
										<div class="font-medium">{rider.bankInfo.accountName}</div>
									</div>
								</div>
							</div>
						{:else}
							<div class="text-center p-8 text-muted-foreground">
								<p>No banking information available</p>
							</div>
						{/if}
					</div>
				</Card>
			{/if}
		</div>
	</div>
</div>
