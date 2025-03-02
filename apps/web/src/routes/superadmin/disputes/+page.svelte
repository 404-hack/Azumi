<script lang="ts">
	import { adminState } from '$lib/states/adminState.svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Input } from '$lib/components/ui/input';
	import {
		Search,
		AlertTriangle,
		User,
		Store,
		ShoppingBag,
		MessageCircle,
		Clock,
		MoreVertical
	} from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { formatCurrency, formatDate, formatTime } from '$lib/utils';

	let searchQuery = $state('');
	let selectedTab = $state('all');

	// Mock data for disputes
	const disputes = [
		{
			id: 'DSP-001',
			customer: {
				name: 'John Doe',
				email: 'john@example.com',
				phone: '+234 123 456 7890'
			},
			order: {
				id: 'ORD-001',
				total: 45.99,
				date: new Date('2024-02-01')
			},
			vendor: {
				name: 'Restaurant ABC',
				location: 'Lagos'
			},
			reason: 'Wrong order delivered',
			description:
				'I received a different order than what I ordered. The items are completely different.',
			status: 'pending',
			priority: 'high',
			createdAt: new Date('2024-02-01'),
			updatedAt: new Date('2024-02-01'),
			messages: [
				{
					sender: 'customer',
					message: 'I received the wrong order',
					timestamp: new Date('2024-02-01T10:00:00')
				},
				{
					sender: 'vendor',
					message: 'We apologize for the mix-up',
					timestamp: new Date('2024-02-01T10:05:00')
				}
			]
		},
		{
			id: 'DSP-002',
			customer: {
				name: 'Jane Smith',
				email: 'jane@example.com',
				phone: '+234 123 456 7891'
			},
			order: {
				id: 'ORD-002',
				total: 32.5,
				date: new Date('2024-02-02')
			},
			vendor: {
				name: 'Restaurant XYZ',
				location: 'Abuja'
			},
			reason: 'Late delivery',
			description: 'Order was delivered 2 hours late without any updates.',
			status: 'investigating',
			priority: 'medium',
			createdAt: new Date('2024-02-02'),
			updatedAt: new Date('2024-02-02'),
			messages: [
				{
					sender: 'customer',
					message: 'My order is very late',
					timestamp: new Date('2024-02-02T15:00:00')
				}
			]
		}
	];

	let filteredDisputes = $derived(
		disputes.filter((dispute) => {
			const matchesSearch =
				dispute.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				dispute.order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
				dispute.vendor.name.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesTab = selectedTab === 'all' || dispute.status === selectedTab;
			return matchesSearch && matchesTab;
		})
	);

	function getDisputeStatusBadgeVariant(
		status: string
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status) {
			case 'pending':
				return 'destructive';
			case 'investigating':
				return 'secondary';
			case 'resolved':
				return 'default';
			default:
				return 'outline';
		}
	}

	function getPriorityBadgeVariant(
		priority: string
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (priority) {
			case 'high':
				return 'destructive';
			case 'medium':
				return 'secondary';
			case 'low':
				return 'default';
			default:
				return 'outline';
		}
	}

	async function handleDisputeAction(disputeId: string, action: string) {
		await adminState.handleCustomerDispute(disputeId, action);
		// Handle dispute action
	}
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-bold">Disputes Management</h2>
	</div>

	<!-- Disputes List -->
	<Card class="p-6">
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<Tabs.Root value={selectedTab} class="w-[400px]" onValueChange={(v) => (selectedTab = v)}>
					<Tabs.List>
						<Tabs.Trigger value="all">All Disputes</Tabs.Trigger>
						<Tabs.Trigger value="pending">Pending</Tabs.Trigger>
						<Tabs.Trigger value="investigating">Investigating</Tabs.Trigger>
						<Tabs.Trigger value="resolved">Resolved</Tabs.Trigger>
					</Tabs.List>
				</Tabs.Root>
				<div class="relative">
					<Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input placeholder="Search disputes..." class="pl-8" bind:value={searchQuery} />
				</div>
			</div>

			<div class="rounded-md border">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>ID</Table.Head>
							<Table.Head>Customer</Table.Head>
							<Table.Head>Order</Table.Head>
							<Table.Head>Vendor</Table.Head>
							<Table.Head>Reason</Table.Head>
							<Table.Head>Priority</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head>Created</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each filteredDisputes as dispute}
							<Table.Row>
								<Table.Cell class="font-medium">{dispute.id}</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<User class="h-4 w-4 text-muted-foreground" />
										<div>
											<div class="font-medium">{dispute.customer.name}</div>
											<div class="text-sm text-muted-foreground">{dispute.customer.email}</div>
										</div>
									</div>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<ShoppingBag class="h-4 w-4 text-muted-foreground" />
										<div>
											<div class="font-medium">{dispute.order.id}</div>
											<div class="text-sm text-muted-foreground">
												{formatCurrency(dispute.order.total)}
											</div>
										</div>
									</div>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<Store class="h-4 w-4 text-muted-foreground" />
										<div>
											<div class="font-medium">{dispute.vendor.name}</div>
											<div class="text-sm text-muted-foreground">{dispute.vendor.location}</div>
										</div>
									</div>
								</Table.Cell>
								<Table.Cell>
									<div class="max-w-[200px] truncate" title={dispute.description}>
										{dispute.reason}
									</div>
								</Table.Cell>
								<Table.Cell>
									<Badge variant={getPriorityBadgeVariant(dispute.priority)}>
										{dispute.priority}
									</Badge>
								</Table.Cell>
								<Table.Cell>
									<Badge variant={getDisputeStatusBadgeVariant(dispute.status)}>
										{dispute.status}
									</Badge>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<Clock class="h-4 w-4 text-muted-foreground" />
										<span>{formatDate(dispute.createdAt)}</span>
									</div>
								</Table.Cell>
								<Table.Cell class="text-right">
									<DropdownMenu.Root>
										<DropdownMenu.Trigger>
											<Button variant="ghost" size="icon">
												<MoreVertical class="h-4 w-4" />
												<span class="sr-only">Actions</span>
											</Button>
										</DropdownMenu.Trigger>
										<DropdownMenu.Content align="end">
											<DropdownMenu.Item onclick={() => handleDisputeAction(dispute.id, 'view')}>
												View Details
											</DropdownMenu.Item>
											<DropdownMenu.Item onclick={() => handleDisputeAction(dispute.id, 'message')}>
												Send Message
											</DropdownMenu.Item>
											<DropdownMenu.Separator />
											<DropdownMenu.Item
												onclick={() => handleDisputeAction(dispute.id, 'refund')}
												class="text-yellow-600"
											>
												Issue Refund
											</DropdownMenu.Item>
											<DropdownMenu.Item
												onclick={() => handleDisputeAction(dispute.id, 'resolve')}
												class="text-green-600"
											>
												Mark as Resolved
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
