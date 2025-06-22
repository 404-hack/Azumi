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
	let pageSize = $state(5);
	let currentPage = $state(1);
	let totalCustomers = $state(0);
	let totalPages = $state(0);

	// Ban modal state
	let showBanModal = $state(false);
	let banReason = $state('');
	let banDuration = $state(30); // Days
	let customerToBan = $state<string | null>(null);

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
</script>
