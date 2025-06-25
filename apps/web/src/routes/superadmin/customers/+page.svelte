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
		User,
		ShoppingBag,
		MoreVertical,
		Calendar,
		DollarSign,
		MapPin,
		AlertTriangle
	} from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Dialog from '$lib/components/ui/dialog';
	import { formatCurrency, formatDate } from '$lib/utils';
	import { authClient } from '$lib/auth-client';
	import { onMount } from 'svelte';

	let searchQuery = $state('');
	let selectedTab = $state('all');
	let customers = $state<any[]>([]);
	let loading = $state(true);
	let pageSize = $state(51);
	let currentPage = $state(1);
	let totalCustomers = $state(0);
	let totalPages = $state(0);
	// Ban modal state
	let showBanModal = $state(false);
	let banReason = $state('');
	let banDuration = $state(30); // Days
	let customerToBan = $state<string | null>(null);

	// Sessions modal state
	let showSessionsModal = $state(false);
	let customerSessions = $state<any[]>([]);
	let sessionsLoading = $state(false);
	let customerForSessions = $state<string | null>(null);
	let customerNameForSessions = $state('');

	// Fetch customers from the server
	async function fetchCustomers() {
		loading = true;
		try {
			// Following strictly the documentation format
			const query: any = {
				limit: pageSize,
				offset: (currentPage - 1) * pageSize
			};

			// Only add search parameters if there's a search query
			if (searchQuery) {
				query.search = {
					field: 'name',
					operator: 'contains',
					value: searchQuery
				};
			}

			const result = await authClient.admin.listUsers({ query });
			customers = result.data.users.map((user) => ({
				id: user.id,
				name: user.name || user.email?.split('@')[0] || 'Unknown',
				email: user.email,
				totalOrders: user.data?.totalOrders || 0,
				totalSpent: user.data?.totalSpent || 0,
				joinedDate: user.createdAt,
				lastOrder: user.data?.lastOrder,
				location: user.data?.location || 'Unknown',
				banned: user.banned || false,
				banReason: user.banReason,
				banExpires: user.banExpires
			}));

			totalCustomers = result.data.total;
			totalPages = Math.ceil(totalCustomers / pageSize);
		} catch (error) {
			console.error('Failed to fetch customers:', error);
			customers = [];
		} finally {
			loading = false;
		}
	}

	function goToNextPage() {
		if (currentPage < totalPages) {
			currentPage++;
			fetchCustomers();
		}
	}

	function goToPreviousPage() {
		if (currentPage > 1) {
			currentPage--;
			fetchCustomers();
		}
	}

	// Active disputes data - could be replaced with a server fetch too
	const activeDisputes = [
		{
			id: 'DSP-001',
			customer: {
				name: 'John Doe',
				email: 'john@example.com'
			},
			orderId: 'ORD-001',
			vendor: 'Restaurant ABC',
			reason: 'Wrong order delivered',
			status: 'pending',
			createdAt: new Date('2024-02-01')
		},
		{
			id: 'DSP-002',
			customer: {
				name: 'Jane Smith',
				email: 'jane@example.com'
			},
			orderId: 'ORD-002',
			vendor: 'Restaurant XYZ',
			reason: 'Order not delivered',
			status: 'investigating',
			createdAt: new Date('2024-02-02')
		}
	];

	let filteredCustomers = $derived(
		customers.filter((customer) => {
			const matchesTab =
				selectedTab === 'all' ||
				(selectedTab === 'active' &&
					customer.lastOrder &&
					new Date(customer.lastOrder).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000);
			return matchesTab;
		})
	);

	$effect(() => {
		fetchCustomers();
	});
	$effect(() => {
		// Reset to first page and fetch when search query changes
		currentPage = 1;
		fetchCustomers();
	});

	$effect(() => {
		if (selectedTab) {
			// For local filtering, we don't need to refetch since we filter in the derived
			// If filtering should happen server-side, uncomment the next line
			// fetchCustomers();
		}
	});

	// Open ban modal to enter reason
	function openBanModal(customerId: string) {
		customerToBan = customerId;
		banReason = '';
		banDuration = 30;
		showBanModal = true;
	}

	// Handle customer ban with reason
	async function confirmBanCustomer() {
		if (!customerToBan) return;

		await handleCustomerAction(
			customerToBan,
			'ban',
			banReason || 'Admin action',
			banDuration * 24 * 60 * 60 // Convert days to seconds
		);

		// Reset and close modal
		showBanModal = false;
		customerToBan = null;
	}
	// Handle all customer actions including disputes and ban/unban
	async function handleCustomerAction(
		customerId: string,
		action: string,
		reason?: string,
		expiresIn?: number
	) {
		loading = true;
		try {
			if (action === 'block' || action === 'ban') {
				// Ban the user - using admin.banUser from the documentation
				await authClient.admin.banUser({
					userId: customerId,
					banReason: reason || 'Admin action', // Optional reason, defaults if not provided
					banExpiresIn: expiresIn || 60 * 60 * 24 * 30 // Ban for 30 days by default
				});

				// Refresh the customer list to show updated status
				await fetchCustomers();
			} else if (action === 'unban') {
				// Unban the user - using admin.unbanUser from the documentation
				await authClient.admin.unbanUser({
					userId: customerId
				});

				// Refresh the customer list to show updated status
				await fetchCustomers();
			} else if (action === 'impersonate') {
				// Impersonate the user - using admin.impersonateUser from the documentation
				const result = await authClient.admin.impersonateUser({
					userId: customerId
				});

				// Redirect to home page as the impersonated user
				window.location.href = '/';
			} else if (action === 'revoke-sessions') {
				// Revoke all sessions for the user - using admin.revokeUserSessions from the documentation
				await authClient.admin.revokeUserSessions({
					userId: customerId
				});

				alert('All sessions for this user have been revoked successfully.');
			} else if (action === 'resolve') {
				// Handle dispute resolution (original functionality)
				adminState.handleCustomerDispute(customerId, action);
			}
		} catch (error) {
			console.error(`Failed to ${action} customer:`, error);
			alert(`Error: Failed to ${action} customer. Please try again.`);
		} finally {
			loading = false;
		}
	}

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

	function getBadgeVariantForUser(user: any): 'default' | 'secondary' | 'destructive' | 'outline' {
		if (user.banned) return 'destructive';
		return 'outline';
	}

	// Open sessions modal and load sessions for user
	async function openSessionsModal(customerId: string, customerName: string) {
		customerForSessions = customerId;
		customerNameForSessions = customerName;
		sessionsLoading = true;
		customerSessions = [];
		showSessionsModal = true;

		try {
			const result = await authClient.admin.listUserSessions({
				userId: customerId
			});
			customerSessions = result.data || [];
		} catch (error) {
			console.error('Failed to fetch sessions:', error);
			alert('Error: Failed to fetch user sessions.');
		} finally {
			sessionsLoading = false;
		}
	}

	// Revoke a specific session
	async function revokeSession(sessionToken: string) {
		try {
			await authClient.admin.revokeUserSession({
				sessionToken: sessionToken
			});

			// Remove the session from the list
			customerSessions = customerSessions.filter((session) => session.token !== sessionToken);

			alert('Session revoked successfully.');
		} catch (error) {
			console.error('Failed to revoke session:', error);
			alert('Error: Failed to revoke session.');
		}
	}
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-bold">Customers Management</h2>
		<Button href="/superadmin/customers/new">Add New Customer</Button>
	</div>

	<!-- Active Disputes -->

	<!-- Customers List -->
	<Card class="p-6">
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<Tabs.Root value={selectedTab} class="w-[400px]" onValueChange={(v) => (selectedTab = v)}>
					<Tabs.List>
						<Tabs.Trigger value="all">All Customers</Tabs.Trigger>
						<Tabs.Trigger value="active">Active</Tabs.Trigger>
					</Tabs.List>
				</Tabs.Root>
				<div class="relative">
					<Search class="text-muted-foreground absolute left-2 top-2.5 h-4 w-4" />
					<Input placeholder="Search customers..." class="pl-8" bind:value={searchQuery} />
				</div>
			</div>
			<div class="rounded-md border">
				{#if loading}
					<div class="py-10 text-center">
						<div
							class="border-primary inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-r-transparent"
						></div>
						<p class="text-muted-foreground mt-2 text-sm">Loading customers...</p>
					</div>
				{:else if customers.length === 0}
					<div class="py-10 text-center">
						<p class="text-muted-foreground">No customers found</p>
					</div>
				{:else}
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Customer</Table.Head>
								<Table.Head>Total Orders</Table.Head>
								<Table.Head>Total Spent</Table.Head>
								<Table.Head>Location</Table.Head>
								<Table.Head>Joined</Table.Head>
								<Table.Head>Last Order</Table.Head>
								<Table.Head class="text-right">Actions</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each filteredCustomers as customer}
								<Table.Row>
									<Table.Cell>
										<div class="flex items-center gap-2">
											<div class="bg-muted h-8 w-8 overflow-hidden rounded-full">
												<img
													src="https://api.dicebear.com/7.x/avataaars/svg?seed={customer.name}"
													alt="{customer.name}'s avatar"
													class="h-full w-full"
												/>
											</div>
											<div>
												<div class="flex items-center gap-1">
													<span class="font-medium">{customer.name}</span>
													{#if customer.banned}
														<Badge variant="destructive" class="ml-2">Banned</Badge>
													{/if}
												</div>
												<div class="text-muted-foreground text-sm">ID: {customer.id}</div>
											</div>
										</div>
									</Table.Cell>
									<Table.Cell>
										<div class="flex items-center gap-2">
											<ShoppingBag class="text-muted-foreground h-4 w-4" />
											<span>{customer.totalOrders}</span>
										</div>
									</Table.Cell>
									<Table.Cell>
										<div class="flex items-center gap-2">
											<DollarSign class="text-muted-foreground h-4 w-4" />
											<span>{formatCurrency(customer.totalSpent)}</span>
										</div>
									</Table.Cell>
									<Table.Cell>
										<div class="flex items-center gap-1">
											<MapPin class="text-muted-foreground h-4 w-4" />
											<span>{customer.location}</span>
										</div>
									</Table.Cell>
									<Table.Cell>{formatDate(customer.joinedDate)}</Table.Cell>
									<Table.Cell
										>{customer.lastOrder ? formatDate(customer.lastOrder) : 'Never'}</Table.Cell
									>
									<Table.Cell class="text-right">
										<DropdownMenu.Root>
											<DropdownMenu.Trigger>
												<Button variant="ghost" size="icon">
													<MoreVertical class="h-4 w-4" />
													<span class="sr-only">Actions</span>
												</Button>
											</DropdownMenu.Trigger>
											<DropdownMenu.Content align="end">
												<DropdownMenu.Item href="/superadmin/customers/{customer.id}">
													View Profile
												</DropdownMenu.Item>
												<DropdownMenu.Item href="/superadmin/customers/{customer.id}/orders">
													Order History
												</DropdownMenu.Item>
												<DropdownMenu.Separator />
												{#if !customer.banned}
													<DropdownMenu.Item
														class="text-red-600"
														onclick={() => openBanModal(customer.id)}
													>
														Block Customer
													</DropdownMenu.Item>
												{:else}
													<DropdownMenu.Item
														class="text-green-600"
														onclick={() => handleCustomerAction(customer.id, 'unban')}
													>
														Unblock Customer
													</DropdownMenu.Item>
													{#if customer.banReason}
														<DropdownMenu.Item class="cursor-default opacity-70">
															Reason: {customer.banReason}
														</DropdownMenu.Item>
													{/if}
												{/if}
												<DropdownMenu.Separator />
												<DropdownMenu.Item
													onclick={() => openSessionsModal(customer.id, customer.name)}
												>
													View Sessions
												</DropdownMenu.Item>
												<DropdownMenu.Item
													onclick={() => handleCustomerAction(customer.id, 'revoke-sessions')}
												>
													Revoke All Sessions
												</DropdownMenu.Item>
												<DropdownMenu.Item
													class="text-blue-600"
													onclick={() => handleCustomerAction(customer.id, 'impersonate')}
												>
													Impersonate User
												</DropdownMenu.Item>
											</DropdownMenu.Content>
										</DropdownMenu.Root>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>

					<!-- Pagination Controls -->
					<div class="flex items-center justify-between border-t px-4 py-4">
						<div class="text-muted-foreground text-sm">
							Showing {(currentPage - 1) * pageSize + 1} to {Math.min(
								currentPage * pageSize,
								totalCustomers
							)} of {totalCustomers} customers
						</div>
						<div class="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onclick={goToPreviousPage}
								disabled={currentPage === 1}
							>
								Previous
							</Button>
							<div class="text-sm font-medium">
								Page {currentPage} of {totalPages}
							</div>
							<Button
								variant="outline"
								size="sm"
								onclick={goToNextPage}
								disabled={currentPage === totalPages}
							>
								Next
							</Button>
						</div>
					</div>
				{/if}
			</div>
		</div></Card
	>
</div>

<!-- Ban Modal -->
<Dialog.Root bind:open={showBanModal}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Block Customer</Dialog.Title>
			<Dialog.Description>
				Block this customer from accessing the platform. They will not be able to sign in until
				unblocked.
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid gap-2">
				<label for="reason" class="text-sm font-medium">Block Reason</label>
				<Input id="reason" bind:value={banReason} placeholder="Enter reason for blocking..." />
			</div>
			<div class="grid gap-2">
				<label for="duration" class="text-sm font-medium">Block Duration (days)</label>
				<Input id="duration" type="number" bind:value={banDuration} min="1" />
				<p class="text-muted-foreground text-sm">Set to 0 for permanent block</p>
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (showBanModal = false)}>Cancel</Button>
			<Button variant="destructive" onclick={confirmBanCustomer}>Block Customer</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Sessions Modal -->
<Dialog.Root bind:open={showSessionsModal}>
	<Dialog.Content class="sm:max-w-[650px]">
		<Dialog.Header>
			<Dialog.Title>User Sessions - {customerNameForSessions}</Dialog.Title>
			<Dialog.Description>View and manage active sessions for this user.</Dialog.Description>
		</Dialog.Header>

		<div class="py-4">
			{#if sessionsLoading}
				<div class="py-10 text-center">
					<div
						class="border-primary inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-r-transparent"
					></div>
					<p class="text-muted-foreground mt-2 text-sm">Loading sessions...</p>
				</div>
			{:else if customerSessions.length === 0}
				<div class="py-6 text-center">
					<p class="text-muted-foreground">No active sessions found for this user</p>
				</div>
			{:else}
				<div class="overflow-hidden rounded-md border">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Device / IP</Table.Head>
								<Table.Head>Created At</Table.Head>
								<Table.Head>Expires At</Table.Head>
								<Table.Head class="text-right">Actions</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each customerSessions as session}
								<Table.Row>
									<Table.Cell>
										<div>
											<div class="font-medium">
												{session.userAgent || 'Unknown Device'}
											</div>
											<div class="text-muted-foreground text-sm">
												{session.ip || 'Unknown IP'}
											</div>
										</div>
									</Table.Cell>
									<Table.Cell>{formatDate(session.createdAt)}</Table.Cell>
									<Table.Cell>{formatDate(session.expiresAt)}</Table.Cell>
									<Table.Cell class="text-right">
										<Button
											variant="destructive"
											size="sm"
											onclick={() => revokeSession(session.token)}
										>
											Revoke
										</Button>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			{/if}
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={() => (showSessionsModal = false)}>Close</Button>
			<Button
				variant="destructive"
				onclick={() => {
					handleCustomerAction(customerForSessions!, 'revoke-sessions');
					showSessionsModal = false;
				}}
			>
				Revoke All Sessions
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
