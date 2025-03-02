<script lang="ts">
	import { page } from '$app/stores';
	import { adminState } from '$lib/states/adminState.svelte';
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
	import type { RiderProfile } from '$lib/types/rider';

	// Get rider ID from URL params
	const riderId = $page.params.id;

	// Mock rider data (in real app, fetch from adminState or API)
	const rider = {
		id: riderId,
		name: 'John Smith',
		email: 'john@example.com',
		phone: '+234 123 456 7890',
		address: '123 Main St, Lagos',
		status: 'available',
		rating: 4.8,
		totalDeliveries: 850,
		totalEarnings: 12890.5,
		joinedDate: new Date('2023-06-01'),
		lastActive: new Date(),
		vehicleType: 'motorcycle',
		vehicleDetails: {
			make: 'Honda',
			model: 'CB150R',
			year: '2022',
			color: 'Black',
			plateNumber: 'LAG-123-XY'
		},
		bankInfo: {
			bankName: 'First Bank',
			accountNumber: '****5678',
			accountName: 'John Smith'
		},
		documents: [
			{
				type: 'Driver License',
				status: 'verified',
				number: 'DL123456',
				expiryDate: new Date('2025-01-01')
			},
			{
				type: 'Vehicle Insurance',
				status: 'verified',
				number: 'INS789012',
				expiryDate: new Date('2024-12-31')
			},
			{
				type: 'Vehicle Registration',
				status: 'verified',
				number: 'REG345678',
				expiryDate: new Date('2024-12-31')
			}
		]
	};

	// Mock recent deliveries
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

	function getDocumentStatusBadgeVariant(
		status: string
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status) {
			case 'verified':
				return 'default';
			case 'pending':
				return 'secondary';
			case 'expired':
				return 'destructive';
			default:
				return 'outline';
		}
	}

	function getRiderStatusBadgeVariant(
		status: string
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
					</div>
					<div class="text-center">
						<h3 class="font-semibold">{rider.name}</h3>
						<p class="text-sm capitalize text-muted-foreground">{rider.vehicleType} Rider</p>
					</div>
					<Badge variant={getRiderStatusBadgeVariant(rider.status)}>
						{rider.status === 'available'
							? 'Online'
							: rider.status === 'offline'
								? 'Offline'
								: 'On Delivery'}
					</Badge>
				</div>

				<div class="space-y-2">
					<div class="flex items-center gap-2">
						<MapPin class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm">{rider.address}</span>
					</div>
					<div class="flex items-center gap-2">
						<Phone class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm">{rider.phone}</span>
					</div>
					<div class="flex items-center gap-2">
						<Mail class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm">{rider.email}</span>
					</div>
					<div class="flex items-center gap-2">
						<Clock class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm">Joined {formatDate(rider.joinedDate)}</span>
					</div>
				</div>

				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-sm text-muted-foreground">Rating</span>
						<div class="flex items-center gap-1">
							<Star class="h-4 w-4 fill-yellow-400 text-yellow-400" />
							<span class="font-medium">{rider.rating.toFixed(1)}</span>
						</div>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-muted-foreground">Total Deliveries</span>
						<span class="font-medium">{rider.totalDeliveries}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-muted-foreground">Total Earnings</span>
						<span class="font-medium">{formatCurrency(rider.totalEarnings)}</span>
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
				<div class="grid gap-6">
					<!-- Vehicle Information -->
					<Card class="p-6">
						<h3 class="mb-4 font-semibold">Vehicle Information</h3>
						<div class="grid gap-4 sm:grid-cols-2">
							<div>
								<div class="text-sm text-muted-foreground">Make & Model</div>
								<div class="font-medium">
									{rider.vehicleDetails.make}
									{rider.vehicleDetails.model}
								</div>
							</div>
							<div>
								<div class="text-sm text-muted-foreground">Year</div>
								<div class="font-medium">{rider.vehicleDetails.year}</div>
							</div>
							<div>
								<div class="text-sm text-muted-foreground">Color</div>
								<div class="font-medium">{rider.vehicleDetails.color}</div>
							</div>
							<div>
								<div class="text-sm text-muted-foreground">Plate Number</div>
								<div class="font-medium">{rider.vehicleDetails.plateNumber}</div>
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
				</div>
			{:else if selectedTab === 'documents'}
				<Card class="p-6">
					<h3 class="mb-4 font-semibold">Documents</h3>
					<div class="space-y-4">
						{#each rider.documents as doc}
							<div class="flex items-center justify-between rounded-lg border p-4">
								<div>
									<div class="font-medium">{doc.type}</div>
									<div class="text-sm text-muted-foreground">
										Number: {doc.number}
										<br />
										Expires: {formatDate(doc.expiryDate)}
									</div>
								</div>
								<Badge variant={getDocumentStatusBadgeVariant(doc.status)}>
									{doc.status}
								</Badge>
							</div>
						{/each}
					</div>
				</Card>
			{:else if selectedTab === 'banking'}
				<Card class="p-6">
					<h3 class="mb-4 font-semibold">Banking Information</h3>
					<div class="space-y-4">
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
							<Button variant="outline" class="w-full">Update Banking Information</Button>
						</div>
					</div>
				</Card>
			{/if}
		</div>
	</div>
</div>
