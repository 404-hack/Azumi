<script lang="ts">
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import { client } from '$lib/hc';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import * as Select from '$lib/components/ui/select';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import {
		ShoppingBag,
		Store,
		User,
		Bike,
		Clock,
		MapPin,
		MessageCircle,
		Phone,
		Mail,
		UserPlus,
		Search,
		Star,
		MapPin as Location,
		AlertCircle,
		CheckCircle2,
		Users,
		Navigation,
		Timer,
		Truck,
		Settings,
		Package,
		X,
		CheckCircle,
		Zap
	} from 'lucide-svelte';
	import { formatCurrency, formatDate, formatDateTime, formatTime } from '$lib/utils';
	import { toast } from 'svelte-sonner';

	function getImageUrl(url: string | null | undefined): string {
		if (!url) return 'https://placehold.co/400x300?text=No+Image';
		return url;
	}

	interface Props {
		data: {
			order: any;
			availableRiders: any[];
		};
	}
	let { data } = $props();

	// State for rider assignment
	let showRiderAssignmentDialog = $state(false);
	let isLoadingRiders = $state(false);
	let isAssigningRider = $state(false);
	let riderSearchQuery = $state('');
	let selectedRider = $state<any>(null);
	let availableRiders = $state<any[]>(data.availableRiders || []);

	// Order data from API
	let order = $derived(data.order);
	console.log('🚀 ~ order:', order);
	async function loadAvailableRiders() {
		isLoadingRiders = true;
		try {
			const response = await client.admin.orders[':id']['available-riders'].$get({
				param: { id: order.id }
			});

			if (response.ok) {
				const result = await response.json();
				availableRiders = result.data || [];
			} else {
				throw new Error('Failed to load riders');
			}
		} catch (error) {
			console.error('Failed to load riders:', error);
			toast.error('Failed to load available riders');
		} finally {
			isLoadingRiders = false;
		}
	}
	async function assignRiderToOrder(riderId: string) {
		isAssigningRider = true;
		try {
			const response = await client.admin.orders[':id']['assign-rider'].$post({
				param: { id: order.id },
				json: { riderId }
			});

			if (response.ok) {
				const result = await response.json();
				const assignedRider = availableRiders.find((r) => r.id === riderId);

				if (assignedRider) {
					// Update order state
					order.riderId = riderId;
					order.riderName = assignedRider.name;
					order.status = 'RIDER_ASSIGNED';

					toast.success(`Rider ${assignedRider.name} has been assigned successfully`);
					showRiderAssignmentDialog = false;
					selectedRider = null;

					// Refresh the page data
					await invalidateAll();
				}
			} else {
				const error = await response.json();
				throw new Error(error.message || 'Failed to assign rider');
			}
		} catch (error) {
			console.error('Failed to assign rider:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to assign rider');
		} finally {
			isAssigningRider = false;
		}
	}

	async function autoAssignRider() {
		isAssigningRider = true;
		try {
			const response = await client.admin.orders[':id']['auto-assign-rider'].$post({
				param: { id: order.id }
			});

			if (response.ok) {
				const result = await response.json();
				toast.success('Rider auto-assigned successfully');
				await invalidateAll();
			} else {
				const error = await response.json();
				throw new Error(error.message || 'Failed to auto-assign rider');
			}
		} catch (error) {
			console.error('Failed to auto-assign rider:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to auto-assign rider');
		} finally {
			isAssigningRider = false;
		}
	}
	// Enhanced admin order status management
	let isUpdatingStatus = $state(false);

	async function updateOrderStatus(newStatus: string, adminNotes?: string) {
		if (isUpdatingStatus) return;

		try {
			isUpdatingStatus = true;

			const response = await client.admin.orders[':id'].status.$patch({
				param: { id: order.id },
				json: {
					status: newStatus,
					adminNotes: adminNotes || `Admin override: ${newStatus.toLowerCase()}`
				}
			});

			if (response.ok) {
				const result = await response.json();

				// Update local order state with new status
				order.status = newStatus;

				// Update timestamps based on status
				if (newStatus === 'CONFIRMED') {
					order.acceptedAt = new Date().toISOString();
				} else if (newStatus === 'READY') {
					order.readyAt = new Date().toISOString();
				} else if (newStatus === 'CANCELLED') {
					order.canceledAt = new Date().toISOString();
				}

				toast.success(`Order status updated to ${newStatus} successfully`);
				await invalidateAll();
			} else {
				const error = await response.json();
				if (error.validTransitions) {
					throw new Error(
						`${error.error}. Valid transitions: ${error.validTransitions.join(', ')}`
					);
				}
				throw new Error(error.error || 'Failed to update order status');
			}
		} catch (error) {
			console.error('Failed to update order status:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to update order status');
		} finally {
			isUpdatingStatus = false;
		}
	}

	async function cancelOrder() {
		const reason = prompt('Please provide a reason for cancelling this order:');
		if (!reason) return;

		try {
			isUpdatingStatus = true;

			const response = await client.admin.orders[':id'].status.$patch({
				param: { id: order.id },
				json: {
					status: 'CANCELLED',
					adminNotes: `Admin cancellation: ${reason}`,
					cancelReason: reason
				}
			});

			if (response.ok) {
				order.status = 'CANCELLED';
				order.cancelReason = reason;
				order.canceledAt = new Date().toISOString();
				toast.success('Order cancelled successfully');
				await invalidateAll();
			} else {
				const error = await response.json();
				throw new Error(error.error || 'Failed to cancel order');
			}
		} catch (error) {
			console.error('Failed to cancel order:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to cancel order');
		} finally {
			isUpdatingStatus = false;
		}
	}

	// Enhanced status action with confirmation
	async function confirmOrderAction(newStatus: string, actionName: string) {
		const confirmMessage = `Are you sure you want to ${actionName}? This will override the vendor's control.`;

		if (confirm(confirmMessage)) {
			await updateOrderStatus(newStatus, `Admin override: ${actionName}`);
		}
	}
	function openRiderAssignment() {
		showRiderAssignmentDialog = true;
		// Riders are already loaded from page data, but we can refresh if needed
		if (availableRiders.length === 0) {
			loadAvailableRiders();
		}
	}
	// Filter riders based on search query
	let filteredRiders = $derived(
		availableRiders.filter(
			(rider) =>
				rider.name.toLowerCase().includes(riderSearchQuery.toLowerCase()) ||
				rider.phone.includes(riderSearchQuery) ||
				rider.currentLocation.toLowerCase().includes(riderSearchQuery.toLowerCase())
		)
	);

	function getVehicleIcon(vehicleType: string) {
		return vehicleType === 'bicycle' ? Bike : Bike; // Both use Bike icon for now
	}

	function getRatingStars(rating: number) {
		return Math.round(rating);
	}
	function getOrderStatusBadgeVariant(
		status: string
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status) {
			case 'new':
				return 'default';
			case 'preparing':
				return 'secondary';
			case 'ready':
				return 'default';
			case 'completed':
				return 'outline';
			case 'cancelled':
				return 'destructive';
			default:
				return 'outline';
		}
	}
	function getDeliveryStatusBadgeVariant(
		status: string
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status) {
			case 'pending':
				return 'outline';
			case 'assigned':
				return 'secondary';
			case 'picked_up':
				return 'default';
			case 'delivered':
				return 'default';
			case 'failed':
				return 'destructive';
			default:
				return 'outline';
		}
	}
	function openGoogleMapsDirections() {
		const shopAddress = order.shop?.address || order.shop?.name || 'Shop location not available';
		const deliveryAddress =
			order.addressName || order.deliveryAddress || 'Delivery location not available';

		// Check if both addresses are the same or too similar
		if (
			shopAddress === deliveryAddress ||
			shopAddress.toLowerCase().includes(deliveryAddress.toLowerCase()) ||
			deliveryAddress.toLowerCase().includes(shopAddress.toLowerCase())
		) {
			// If addresses are the same, just open the location on Google Maps
			const baseUrl = 'https://www.google.com/maps/search/';
			const params = new URLSearchParams({
				api: '1',
				query: deliveryAddress
			});
			const url = `${baseUrl}?${params.toString()}`;
			window.open(url, '_blank');

			toast.error(
				'Pickup and delivery locations appear to be the same. Opening location view instead of directions.'
			);
			return;
		}

		// If addresses are different, show directions
		const baseUrl = 'https://www.google.com/maps/dir/';
		const params = new URLSearchParams({
			api: '1',
			origin: shopAddress,
			destination: deliveryAddress,
			travelmode: 'driving'
		});

		const url = `${baseUrl}?${params.toString()}`;
		window.open(url, '_blank');
	}

	function openLocationOnMap(address: string, locationType: string) {
		if (
			!address ||
			address === 'Shop location not available' ||
			address === 'Delivery location not available'
		) {
			toast.error(`${locationType} address is not available`);
			return;
		}

		const baseUrl = 'https://www.google.com/maps/search/';
		const params = new URLSearchParams({
			api: '1',
			query: address
		});
		const url = `${baseUrl}?${params.toString()}`;
		window.open(url, '_blank');
	}
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<div class="space-y-1">
			<h2 class="text-2xl font-bold">Order Details</h2>
			<p class="text-muted-foreground">Order #{order.id}</p>
		</div>
		<div class="flex items-center gap-4">
			<Button variant="outline" onclick={() => history.back()}>Back</Button>
			{#if order.status === 'READY' && !order.riderId}
				<Button onclick={openRiderAssignment} class="bg-orange-600 hover:bg-orange-700">
					<UserPlus class="mr-2 h-4 w-4" />
					Assign Rider
				</Button>
				<Button onclick={autoAssignRider} variant="outline" disabled={isAssigningRider}>
					<Zap class="mr-2 h-4 w-4" />
					{isAssigningRider ? 'Auto-assigning...' : 'Auto Assign'}
				</Button>
			{/if}
			{#if order.status !== 'COMPLETED' && order.status !== 'CANCELLED'}
				<Button variant="destructive">Cancel Order</Button>
			{/if}
		</div>
	</div>

	<div class="grid gap-6 md:grid-cols-2">
		<!-- Order Status -->
		<Card class="p-6">
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<h3 class="font-semibold">Order Status</h3>
					<Badge variant={getOrderStatusBadgeVariant(order.status)}>{order.status}</Badge>
				</div>
				<!-- Enhanced Admin Status Controls -->
				{#if order.status !== 'COMPLETED' && order.status !== 'CANCELLED'}
					<div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
						<div class="mb-3 flex items-center gap-2">
							<Settings class="h-5 w-5 text-blue-600" />
							<span class="font-medium text-blue-900">Admin Status Controls</span>
						</div>
						<div class="grid gap-2">
							{#if order.status === 'PAYMENT_CONFIRMED'}
								<Button
									onclick={() => confirmOrderAction('CONFIRMED', 'confirm this order')}
									class="w-full"
									size="sm"
									disabled={isUpdatingStatus}
								>
									<CheckCircle class="mr-2 h-4 w-4" />
									{isUpdatingStatus ? 'Confirming...' : 'Confirm Order (Override Vendor)'}
								</Button>
							{:else if order.status === 'CONFIRMED'}
								<Button
									onclick={() => confirmOrderAction('READY', 'mark this order as ready')}
									class="w-full"
									size="sm"
									disabled={isUpdatingStatus}
								>
									<Package class="mr-2 h-4 w-4" />
									{isUpdatingStatus ? 'Updating...' : 'Mark as Ready (Override Vendor)'}
								</Button>
							{:else if order.status === 'READY'}
								<div class="rounded border border-green-200 bg-green-50 p-3">
									<div class="flex items-center gap-2 text-green-800">
										<CheckCircle class="h-4 w-4" />
										<span class="text-sm font-medium">Order is ready for rider assignment</span>
									</div>
									<p class="mt-1 text-xs text-green-700">
										The order is now ready for pickup. Use the rider assignment section below to
										assign a rider.
									</p>
								</div>
							{:else if order.status === 'RIDER_ASSIGNED'}
								<div class="rounded border border-purple-200 bg-purple-50 p-3">
									<div class="flex items-center gap-2 text-purple-800">
										<User class="h-4 w-4" />
										<span class="text-sm font-medium">Rider assigned - waiting for pickup</span>
									</div>
									<p class="mt-1 text-xs text-purple-700">
										A rider has been assigned and should pick up the order soon.
									</p>
								</div>
							{:else if order.status === 'IN_TRANSIT'}
								<div class="rounded border border-indigo-200 bg-indigo-50 p-3">
									<div class="flex items-center gap-2 text-indigo-800">
										<Truck class="h-4 w-4" />
										<span class="text-sm font-medium">Order in transit</span>
									</div>
									<p class="mt-1 text-xs text-indigo-700">
										The order is on its way to the customer.
									</p>
								</div>
							{:else if order.status === 'DELIVERED'}
								<div class="rounded border border-teal-200 bg-teal-50 p-3">
									<div class="flex items-center gap-2 text-teal-800">
										<CheckCircle class="h-4 w-4" />
										<span class="text-sm font-medium">Order delivered</span>
									</div>
									<p class="mt-1 text-xs text-teal-700">
										The order has been successfully delivered to the customer.
									</p>
								</div>
							{/if}

							<!-- Cancel button available for cancellable statuses -->
							{#if ['PAYMENT_CONFIRMED', 'CONFIRMED', 'READY', 'RIDER_ASSIGNED'].includes(order.status)}
								<Button
									onclick={cancelOrder}
									variant="destructive"
									size="sm"
									class="w-full"
									disabled={isUpdatingStatus}
								>
									<X class="mr-2 h-4 w-4" />
									{isUpdatingStatus ? 'Cancelling...' : 'Cancel Order'}
								</Button>
							{/if}
						</div>
						<div class="bg-blue-25 mt-3 rounded border border-blue-100 p-2">
							<p class="text-xs text-blue-800">
								<strong>Admin Override:</strong> These controls allow you to manage the order flow directly,
								bypassing vendor actions. Use responsibly as this affects the normal workflow.
							</p>
							{#if order.status === 'PAYMENT_CONFIRMED'}
								<p class="mt-1 text-xs text-blue-700">
									• Confirm to move order to preparation phase
								</p>
							{:else if order.status === 'CONFIRMED'}
								<p class="mt-1 text-xs text-blue-700">• Mark as ready to enable rider assignment</p>
							{/if}
						</div>
					</div>
				{:else if order.status === 'CANCELLED'}
					<div class="rounded-lg border border-red-200 bg-red-50 p-4">
						<div class="flex items-center gap-2 text-red-800">
							<X class="h-5 w-5" />
							<span class="font-medium">Order Cancelled</span>
						</div>
						{#if order.cancelReason}
							<p class="mt-2 text-sm text-red-700">
								<strong>Reason:</strong>
								{order.cancelReason}
							</p>
						{/if}
						<p class="mt-2 text-xs text-red-600">
							This order has been cancelled and cannot be modified further.
						</p>
					</div>
				{:else if order.status === 'COMPLETED'}
					<div class="rounded-lg border border-green-200 bg-green-50 p-4">
						<div class="flex items-center gap-2 text-green-800">
							<CheckCircle class="h-5 w-5" />
							<span class="font-medium">Order Completed</span>
						</div>
						<p class="mt-2 text-xs text-green-600">This order has been successfully completed.</p>
					</div>
				{/if}
				<div class="grid gap-4">
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground text-sm">Created</span>
						<span>{formatDateTime(order.createdAt)}</span>
					</div>
					{#if order.acceptedAt}
						<div class="flex items-center justify-between">
							<span class="text-muted-foreground text-sm">Accepted At</span>
							<span>{formatDateTime(order.acceptedAt)}</span>
						</div>
					{/if}
					{#if order.preparedAt}
						<div class="flex items-center justify-between">
							<span class="text-muted-foreground text-sm">Prepared At</span>
							<span>{formatDateTime(order.preparedAt)}</span>
						</div>
					{/if}
					{#if order.riderAssignedAt}
						<div class="flex items-center justify-between">
							<span class="text-muted-foreground text-sm">Rider Assigned At</span>
							<span>{formatDateTime(order.riderAssignedAt)}</span>
						</div>
					{/if}
					{#if order.canceledAt}
						<div class="flex items-center justify-between">
							<span class="text-muted-foreground text-sm">Cancelled At</span>
							<span>{formatDateTime(order.canceledAt)}</span>
						</div>
					{/if}
					{#if order.cancelReason}
						<div class="rounded-md border border-red-200 bg-red-50 p-3">
							<div class="flex items-start gap-2">
								<AlertCircle class="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
								<div>
									<div class="text-sm font-medium text-red-900">Cancellation Reason</div>
									<div class="mt-1 text-sm text-red-800">{order.cancelReason}</div>
								</div>
							</div>
						</div>
					{/if}
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground text-sm">Payment Status</span>
						<Badge variant={order.paymentStatus === 'COMPLETED' ? 'default' : 'secondary'}>
							{order.paymentStatus}
						</Badge>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground text-sm">Payment Method</span>
						<span class="capitalize">{order.paymentMethod}</span>
					</div>
				</div>
			</div>
		</Card>
		<!-- Delivery Status -->
		<Card class="p-6">
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<h3 class="font-semibold">Delivery Status</h3>
					{#if order.deliveryStatus}
						<Badge variant={getDeliveryStatusBadgeVariant(order.deliveryStatus)}>
							{order.deliveryStatus}
						</Badge>
					{:else}
						<Badge variant="outline">Not Assigned</Badge>
					{/if}
				</div>
				<div class="grid gap-4">
					<div class="space-y-3">
						<!-- Pickup Location -->
						<div class="flex items-start gap-2">
							<Store class="text-muted-foreground mt-0.5 h-4 w-4" />
							<div class="flex-1">
								<div class="text-sm font-medium text-gray-900">Pickup Location</div>
								<div class="text-muted-foreground text-sm">
									{order.shop?.name || 'Unknown Shop'}
									{#if order.shop?.address}
										<br />
										<span class="text-xs">{order.shop.address}</span>
									{/if}
								</div>
							</div>
							<Button
								variant="ghost"
								size="sm"
								class="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
								onclick={() =>
									openLocationOnMap(order.shop?.address || order.shop?.name || '', 'Pickup')}
								title="View pickup location on map"
							>
								<MapPin class="h-4 w-4" />
							</Button>
						</div>

						<!-- Delivery Location -->
						<div class="flex items-start gap-2">
							<MapPin class="text-muted-foreground mt-0.5 h-4 w-4" />
							<div class="flex-1">
								<div class="text-sm font-medium text-gray-900">Delivery Location</div>
								<div class="text-muted-foreground text-sm">{order.addressName}</div>
							</div>
							<Button
								variant="ghost"
								size="sm"
								class="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
								onclick={() => openLocationOnMap(order.addressName || '', 'Delivery')}
								title="View delivery location on map"
							>
								<MapPin class="h-4 w-4" />
							</Button>
						</div>
					</div>
					{#if order.deliveryNotes}
						<div class="flex items-center gap-2">
							<MessageCircle class="text-muted-foreground h-4 w-4" />
							<span class="text-sm">{order.deliveryNotes}</span>
						</div>
					{/if}

					<!-- Google Maps Direction Button -->
					<div class="mt-4">
						<Button
							variant="outline"
							class="w-full gap-2 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
							onclick={() => openGoogleMapsDirections()}
						>
							<Navigation class="h-4 w-4" />
							View Route on Google Maps
						</Button>
					</div>
					{#if order.rider}
						<!-- Assigned Rider -->
						<div class="mt-2 rounded-lg border p-4">
							<div class="mb-2 font-medium">Assigned Rider</div>
							<div class="flex items-center gap-4">
								<div class="bg-muted h-10 w-10 overflow-hidden rounded-full">
									<img
										src="https://api.dicebear.com/7.x/avataaars/svg?seed={order.rider.name}"
										alt="{order.rider.name}'s avatar"
										class="h-full w-full"
									/>
								</div>
								<div class="flex-1">
									<div class="font-medium">{order.rider.firstName} {order.rider.lastName}</div>
								</div>
								<Button href="tel:{order.rider.user.phoneNumber}" variant="outline">
									<Phone class="mr-2 h-4 w-4" />
									{order.rider.user.phoneNumber}
								</Button>
							</div>
						</div>
					{:else if order.status === 'CANCELLED'}
						<!-- Cancelled Order Information -->
						<div class="mt-2 rounded-lg border border-red-200 bg-red-50 p-4">
							<div class="mb-3 flex items-center gap-2">
								<AlertCircle class="h-5 w-5 text-red-600" />
								<span class="font-medium text-red-900">Order Cancelled</span>
							</div>
							<div class="space-y-3">
								{#if order.canceledAt}
									<div class="flex items-center justify-between text-sm">
										<span class="text-red-700">Cancelled At:</span>
										<span class="font-medium text-red-800">{formatDateTime(order.canceledAt)}</span>
									</div>
								{/if}
								{#if order.cancelReason}
									<div class="text-sm">
										<span class="text-red-700">Reason:</span>
										<div class="mt-1 rounded bg-red-100 p-2 text-red-800">{order.cancelReason}</div>
									</div>
								{/if}
								{#if order.refundStatus}
									<div class="flex items-center justify-between text-sm">
										<span class="text-red-700">Refund Status:</span>
										<Badge variant={order.refundStatus === 'COMPLETED' ? 'default' : 'secondary'}>
											{order.refundStatus}
										</Badge>
									</div>
								{/if}
								{#if order.refundAmount && order.refundAmount > 0}
									<div class="flex items-center justify-between text-sm">
										<span class="text-red-700">Refund Amount:</span>
										<span class="font-medium text-green-600"
											>{formatCurrency(order.refundAmount)}</span
										>
									</div>
								{/if}
								{#if order.refundedAt}
									<div class="flex items-center justify-between text-sm">
										<span class="text-red-700">Refunded At:</span>
										<span class="font-medium text-red-800">{formatDateTime(order.refundedAt)}</span>
									</div>
								{/if}
							</div>
						</div>
					{:else if order.status === 'READY'}
						<!-- Manual Rider Assignment -->
						<div class="mt-2 rounded-lg border border-dashed border-orange-200 bg-orange-50 p-4">
							<div class="mb-3 flex items-center gap-2">
								<AlertCircle class="h-5 w-5 text-orange-600" />
								<span class="font-medium text-orange-900">Rider Assignment Required</span>
							</div>
							<p class="mb-4 text-sm text-orange-800">
								This order is ready for pickup but no rider has been assigned yet. Please manually
								assign a rider to proceed with delivery.
							</p>
							<Button onclick={openRiderAssignment} class="w-full">
								<UserPlus class="mr-2 h-4 w-4" />
								Assign Rider
							</Button>
						</div>
					{:else}
						<!-- No Rider Assigned -->
						<div class="mt-2 rounded-lg border border-dashed p-4">
							<div class="text-muted-foreground text-center text-sm">No rider assigned yet</div>
						</div>
					{/if}
				</div>
			</div>
		</Card>
	</div>

	<!-- Order Status Timeline -->
	<Card class="p-6">
		<div class="space-y-4">
			<h3 class="font-semibold">Order Status Timeline</h3>
			<div class="space-y-3">
				<!-- Payment Confirmed -->
				<div class="flex items-center gap-3">
					<div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
						<CheckCircle class="h-4 w-4 text-green-600" />
					</div>
					<div class="flex-1">
						<div class="text-sm font-medium">Payment Confirmed</div>
						<div class="text-muted-foreground text-xs">
							{formatDateTime(order.paymentConfirmedAt || order.createdAt)}
						</div>
					</div>
				</div>

				<!-- Order Confirmed -->
				{#if order.acceptedAt || order.status !== 'PAYMENT_CONFIRMED'}
					<div class="flex items-center gap-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
							<CheckCircle class="h-4 w-4 text-blue-600" />
						</div>
						<div class="flex-1">
							<div class="text-sm font-medium">Order Confirmed</div>
							<div class="text-muted-foreground text-xs">
								{order.acceptedAt ? formatDateTime(order.acceptedAt) : 'Confirmed by admin'}
							</div>
						</div>
					</div>
				{:else}
					<div class="flex items-center gap-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
							<Clock class="h-4 w-4 text-gray-400" />
						</div>
						<div class="flex-1">
							<div class="text-sm font-medium text-gray-500">Awaiting Confirmation</div>
							<div class="text-muted-foreground text-xs">Waiting for vendor or admin action</div>
						</div>
					</div>
				{/if}

				<!-- Order Ready -->
				{#if order.readyAt || ['READY', 'RIDER_ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(order.status)}
					<div class="flex items-center gap-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
							<Package class="h-4 w-4 text-purple-600" />
						</div>
						<div class="flex-1">
							<div class="text-sm font-medium">Order Ready</div>
							<div class="text-muted-foreground text-xs">
								{order.preparedAt ? formatDateTime(order.preparedAt) : 'Marked ready by admin'}
							</div>
						</div>
					</div>
				{:else}
					<div class="flex items-center gap-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
							<Clock class="h-4 w-4 text-gray-400" />
						</div>
						<div class="flex-1">
							<div class="text-sm font-medium text-gray-500">Preparing Order</div>
							<div class="text-muted-foreground text-xs">Order is being prepared</div>
						</div>
					</div>
				{/if}

				<!-- Rider Assigned -->
				{#if order.riderAssignedAt || ['RIDER_ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(order.status)}
					<div class="flex items-center gap-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
							<User class="h-4 w-4 text-indigo-600" />
						</div>
						<div class="flex-1">
							<div class="text-sm font-medium">Rider Assigned</div>
							<div class="text-muted-foreground text-xs">
								{order.riderAssignedAt
									? formatDateTime(order.riderAssignedAt)
									: 'Recently assigned'}
								{#if order.riderName}
									• {order.riderName}
								{/if}
							</div>
						</div>
					</div>
				{:else if order.status === 'READY'}
					<div class="flex items-center gap-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
							<AlertCircle class="h-4 w-4 text-yellow-600" />
						</div>
						<div class="flex-1">
							<div class="text-sm font-medium text-yellow-700">Awaiting Rider Assignment</div>
							<div class="text-muted-foreground text-xs">Admin needs to assign a rider</div>
						</div>
					</div>
				{:else}
					<div class="flex items-center gap-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
							<Clock class="h-4 w-4 text-gray-400" />
						</div>
						<div class="flex-1">
							<div class="text-sm font-medium text-gray-500">Rider Assignment Pending</div>
							<div class="text-muted-foreground text-xs">Order must be ready first</div>
						</div>
					</div>
				{/if}

				<!-- Order Picked Up -->
				{#if order.pickedUpAt || ['IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(order.status)}
					<div class="flex items-center gap-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
							<Truck class="h-4 w-4 text-orange-600" />
						</div>
						<div class="flex-1">
							<div class="text-sm font-medium">Order Picked Up</div>
							<div class="text-muted-foreground text-xs">
								{order.pickedUpAt ? formatDateTime(order.pickedUpAt) : 'In transit'}
							</div>
						</div>
					</div>
				{:else}
					<div class="flex items-center gap-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
							<Clock class="h-4 w-4 text-gray-400" />
						</div>
						<div class="flex-1">
							<div class="text-sm font-medium text-gray-500">Awaiting Pickup</div>
							<div class="text-muted-foreground text-xs">Rider will pick up order</div>
						</div>
					</div>
				{/if}

				<!-- Order Delivered -->
				{#if order.deliveredAt || ['DELIVERED', 'COMPLETED'].includes(order.status)}
					<div class="flex items-center gap-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
							<CheckCircle class="h-4 w-4 text-green-600" />
						</div>
						<div class="flex-1">
							<div class="text-sm font-medium">Order Delivered</div>
							<div class="text-muted-foreground text-xs">
								{order.deliveredAt ? formatDateTime(order.deliveredAt) : 'Successfully delivered'}
							</div>
						</div>
					</div>
				{:else}
					<div class="flex items-center gap-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
							<Clock class="h-4 w-4 text-gray-400" />
						</div>
						<div class="flex-1">
							<div class="text-sm font-medium text-gray-500">Awaiting Delivery</div>
							<div class="text-muted-foreground text-xs">Order will be delivered to customer</div>
						</div>
					</div>
				{/if}

				<!-- Order Cancelled (if applicable) -->
				{#if order.status === 'CANCELLED'}
					<div class="flex items-center gap-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
							<X class="h-4 w-4 text-red-600" />
						</div>
						<div class="flex-1">
							<div class="text-sm font-medium text-red-700">Order Cancelled</div>
							<div class="text-muted-foreground text-xs">
								{order.canceledAt ? formatDateTime(order.canceledAt) : 'Cancelled'}
								{#if order.cancelReason}
									• {order.cancelReason}
								{/if}
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</Card>

	<div class="grid gap-6 md:grid-cols-3">
		<!-- Customer Info -->
		<Card class="p-6">
			<div class="space-y-4">
				<h3 class="font-semibold">Customer</h3>
				<div class="flex items-center gap-4">
					<div class="bg-muted h-10 w-10 overflow-hidden rounded-full">
						<img
							src="https://api.dicebear.com/7.x/avataaars/svg?seed={order.customer?.name ||
								'Unknown'}"
							alt="{order.customer?.name || 'Unknown'}'s avatar"
							class="h-full w-full"
						/>
					</div>
					<div>
						<div class="font-medium">{order.customer?.name || 'Unknown Customer'}</div>
						<div class="text-muted-foreground text-sm">{order.customer?.email || 'No email'}</div>
					</div>
				</div>
				<div class="grid gap-2">
					{#if order.customer?.phoneNumber}
						<a
							href="tel:{order.customer.phoneNumber}"
							class="border-input bg-background ring-offset-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex w-full items-center justify-center rounded-md border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
						>
							<Phone class="mr-2 h-4 w-4" />
							{order.customer.phoneNumber}
						</a>
					{/if}
					<Button variant="outline" class="w-full">
						<Mail class="mr-2 h-4 w-4" />
						Contact Customer
					</Button>
				</div>
			</div>
		</Card>

		<!-- Vendor Info -->
		<Card class="p-6">
			<div class="space-y-4">
				<h3 class="font-semibold">Shop</h3>
				<div class="flex items-center gap-4">
					<div class="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
						<Store class="text-primary h-6 w-6" />
					</div>
					<div>
						<div class="font-medium">{order.shop?.name || 'Unknown Shop'}</div>
						<div class="text-muted-foreground text-sm">
							{order.shop?.shopType || 'Unknown type'}
						</div>
					</div>
				</div>
				<div class="grid gap-2">
					{#if order.shop?.phoneNumber}
						<a
							href="tel:{order.shop.phoneNumber}"
							class="border-input bg-background ring-offset-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex w-full items-center justify-center rounded-md border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
						>
							<Phone class="mr-2 h-4 w-4" />
							{order.shop.phoneNumber}
						</a>
					{/if}
					<Button variant="outline" class="w-full">
						<Mail class="mr-2 h-4 w-4" />
						Contact Shop
					</Button>
				</div>
			</div>
		</Card>
		<!-- Order Summary -->
		<Card class="p-6">
			<div class="space-y-4">
				<h3 class="font-semibold">Order Summary</h3>
				<div class="space-y-2">
					<div class="flex items-center justify-between text-sm">
						<span class="text-muted-foreground">Subtotal</span>
						<span>{formatCurrency(order.subtotal)}</span>
					</div>
					<div class="flex items-center justify-between text-sm">
						<span class="text-muted-foreground">Delivery Fee</span>
						<span>{formatCurrency(order.deliveryFee)}</span>
					</div>
					<div class="flex items-center justify-between text-sm">
						<span class="text-muted-foreground">Service Fee</span>
						<span>{formatCurrency(order.serviceFee)}</span>
					</div>
					{#if order.discount > 0}
						<div class="flex items-center justify-between text-sm">
							<span class="text-muted-foreground">Discount</span>
							<span class="text-green-600">-{formatCurrency(order.discount)}</span>
						</div>
					{/if}
					<div class="border-t pt-2">
						<div class="flex items-center justify-between font-medium">
							<span>Total</span>
							<span>{formatCurrency(order.total)}</span>
						</div>
					</div>
				</div>
			</div>
		</Card>
	</div>
	<!-- Order Items -->
	<Card class="p-6">
		<div class="space-y-6">
			<div class="flex items-center justify-between">
				<h3 class="font-semibold">Order Items ({order.items?.length || 0})</h3>
				<Badge variant="outline" class="text-xs">
					Total: {formatCurrency(order.subtotal)}
				</Badge>
			</div>

			{#if order.items && order.items.length > 0}
				<div class="space-y-4">
					{#each order.items as item, index}
						<div class="bg-card rounded-lg border p-4">
							<div class="flex items-start gap-4">
								<!-- Menu Item Image -->
								{#if item.menuItem?.imageUrl}
									<div class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
										<img
											src={getImageUrl(item.menuItem.imageUrl)}
											alt={item.menuItemName || item.name}
											class="h-full w-full object-cover"
											loading="lazy"
										/>
									</div>
								{:else}
									<div
										class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100"
									>
										<ShoppingBag class="h-6 w-6 text-gray-400" />
									</div>
								{/if}

								<!-- Item Details -->
								<div class="flex-1 space-y-3">
									<div class="flex items-start justify-between">
										<div>
											<h4 class="text-base font-medium">{item.menuItemName || item.name}</h4>
											<div class="text-muted-foreground mt-1 flex items-center gap-4 text-sm">
												<span>Qty: {item.quantity}</span>
												<span>Unit Price: {formatCurrency(item.unitPrice || item.price)}</span>
											</div>
										</div>
										<div class="text-right">
											<div class="text-lg font-semibold">
												{formatCurrency(item.totalPrice || item.price * item.quantity)}
											</div>
											<div class="text-muted-foreground text-xs">
												{item.quantity} × {formatCurrency(item.unitPrice || item.price)}
											</div>
										</div>
									</div>

									<!-- Special Instructions -->
									{#if item.specialInstructions}
										<div class="rounded-md border border-blue-200 bg-blue-50 p-3">
											<div class="flex items-start gap-2">
												<MessageCircle class="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
												<div>
													<div class="text-sm font-medium text-blue-900">Special Instructions</div>
													<div class="mt-1 text-sm text-blue-800">{item.specialInstructions}</div>
												</div>
											</div>
										</div>
									{/if}
									<!-- Item Options/Customizations -->
									{#if item.options && item.options.length > 0}
										<div class="rounded-md border border-gray-200 bg-gray-50 p-3">
											<div class="mb-2 text-sm font-medium text-gray-900">Customizations</div>
											<div class="space-y-2">
												{#each item.options as option}
													<div class="flex items-center justify-between">
														<div class="flex items-center gap-2">
															{#if option.optionGroup?.name}
																<span class="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700">
																	{option.optionGroup.name}:
																</span>
															{/if}
															<span class="text-sm font-medium">{option.optionName}</span>
														</div>
														<span class="text-sm font-medium">
															{#if option.price && option.price > 0}
																+{formatCurrency(option.price)}
															{:else}
																Free
															{/if}
														</span>
													</div>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>

				<!-- Order Items Summary -->
				<div class="border-t pt-4">
					<div class="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
						<div class="text-center">
							<div class="text-muted-foreground">Total Items</div>
							<div class="text-lg font-semibold">{order.items.length}</div>
						</div>
						<div class="text-center">
							<div class="text-muted-foreground">Total Quantity</div>
							<div class="text-lg font-semibold">
								{order.items.reduce((sum, item) => sum + item.quantity, 0)}
							</div>
						</div>
						<div class="text-center">
							<div class="text-muted-foreground">Avg Item Price</div>
							<div class="text-lg font-semibold">
								{formatCurrency(
									order.subtotal / order.items.reduce((sum, item) => sum + item.quantity, 0)
								)}
							</div>
						</div>
						<div class="text-center">
							<div class="text-muted-foreground">Items Subtotal</div>
							<div class="text-lg font-semibold text-green-600">
								{formatCurrency(order.subtotal)}
							</div>
						</div>
					</div>
				</div>
			{:else}
				<div class="text-muted-foreground py-8 text-center">
					<ShoppingBag class="mx-auto mb-4 h-12 w-12 opacity-50" />
					<p>No items found in this order</p>
				</div>
			{/if}
		</div>
	</Card>
</div>

<!-- Rider Assignment Dialog -->
<Dialog.Root bind:open={showRiderAssignmentDialog}>
	<Dialog.Content class="max-w-4xl">
		<Dialog.Header>
			<Dialog.Title>Assign Rider to Order #{order.id}</Dialog.Title>
			<Dialog.Description>
				Select an available rider to handle this delivery. Riders are sorted by distance from pickup
				location.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-6">
			<!-- Order Info Summary -->
			<div class="bg-muted/50 rounded-lg p-4">
				<div class="grid gap-2 md:grid-cols-2">
					<div class="flex items-center gap-2">
						<Store class="text-muted-foreground h-4 w-4" />
						<span class="text-sm">Pickup: {order.shop?.name || 'Unknown Shop'}</span>
					</div>
					<div class="flex items-center gap-2">
						<MapPin class="text-muted-foreground h-4 w-4" />
						<span class="text-sm">Delivery: {order.addressName}</span>
					</div>
					<div class="flex items-center gap-2">
						<Clock class="text-muted-foreground h-4 w-4" />
						<span class="text-sm">Total: {formatCurrency(order.total)}</span>
					</div>
					<div class="flex items-center gap-2">
						<Zap class="text-muted-foreground h-4 w-4" />
						<span class="text-sm">Fee: {formatCurrency(order.deliveryFee)}</span>
					</div>
				</div>
			</div>

			<!-- Search and Filter -->
			<div class="space-y-4">
				<div class="relative">
					<Search class="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
					<Input
						bind:value={riderSearchQuery}
						placeholder="Search riders by name, phone, or location..."
						class="pl-10"
					/>
				</div>
			</div>

			<!-- Available Riders -->
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<h4 class="font-medium">Available Riders ({filteredRiders.length})</h4>
					{#if isLoadingRiders}
						<Badge variant="secondary">Loading...</Badge>
					{:else}
						<Badge variant="outline">Ready to assign</Badge>
					{/if}
				</div>

				{#if isLoadingRiders}
					<div class="space-y-3">
						{#each Array(3) as _}
							<div class="animate-pulse rounded-lg border p-4">
								<div class="flex items-center gap-4">
									<div class="bg-muted h-12 w-12 rounded-full"></div>
									<div class="flex-1 space-y-2">
										<div class="bg-muted h-4 w-32 rounded"></div>
										<div class="bg-muted h-3 w-24 rounded"></div>
									</div>
									<div class="bg-muted h-8 w-20 rounded"></div>
								</div>
							</div>
						{/each}
					</div>
				{:else if filteredRiders.length === 0}
					<div class="rounded-lg border border-dashed p-8 text-center">
						<Users class="text-muted-foreground mx-auto h-12 w-12" />
						<h4 class="mt-4 font-medium">No available riders found</h4>
						<p class="text-muted-foreground text-sm">
							{riderSearchQuery
								? 'Try adjusting your search criteria'
								: 'All riders are currently busy or offline'}
						</p>
					</div>
				{:else}
					<div class="max-h-96 space-y-3 overflow-y-auto">
						{#each filteredRiders as rider (rider.id)}
							<div
								class="hover:bg-muted/50 cursor-pointer rounded-lg border p-4 transition-colors"
								class:ring-2={selectedRider?.id === rider.id}
								class:ring-primary={selectedRider?.id === rider.id}
								onclick={() => (selectedRider = rider)}
							>
								<div class="flex items-center gap-4">
									<!-- Rider Avatar -->
									<div class="bg-muted h-12 w-12 overflow-hidden rounded-full">
										<img
											src="https://api.dicebear.com/7.x/avataaars/svg?seed={rider.name}"
											alt="{rider.name}'s avatar"
											class="h-full w-full"
										/>
									</div>

									<!-- Rider Info -->
									<div class="flex-1">
										<div class="flex items-center gap-2">
											<h5 class="font-medium">{rider.name}</h5>
											<div class="flex items-center gap-1">
												{#each Array(getRatingStars(rider.rating)) as _}
													<Star class="h-3 w-3 fill-yellow-400 text-yellow-400" />
												{/each}
												<span class="text-muted-foreground text-sm">({rider.rating})</span>
											</div>
										</div>

										<div class="text-muted-foreground mt-1 grid gap-1 text-sm md:grid-cols-2">
											<div class="flex items-center gap-1">
												<Phone class="h-3 w-3" />
												{rider.phone}
											</div>
											<div class="flex items-center gap-1">
												<Navigation class="h-3 w-3" />
												{rider.distanceFromPickup}km away
											</div>
											<div class="flex items-center gap-1">
												{#if rider.vehicleType === 'bicycle'}
													<Bike class="h-3 w-3" />
												{:else}
													<Bike class="h-3 w-3" />
												{/if}
												{rider.vehicleType}
											</div>
											<div class="flex items-center gap-1">
												<Timer class="h-3 w-3" />
												~{rider.estimatedArrival} min arrival
											</div>
										</div>

										<div class="text-muted-foreground mt-2 text-xs">
											📍 Currently at: {rider.currentLocation}
										</div>
									</div>

									<!-- Rider Stats -->
									<div class="text-right">
										<div class="text-sm font-medium">{rider.totalDeliveries} deliveries</div>
										<div class="text-muted-foreground text-xs">
											₦{(rider.earnings / 1000).toFixed(0)}k earned
										</div>
										<Badge variant="outline" class="mt-1 text-xs">
											{rider.status}
										</Badge>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={() => (showRiderAssignmentDialog = false)}>Cancel</Button>
			<Button
				onclick={() => selectedRider && assignRiderToOrder(selectedRider.id)}
				disabled={!selectedRider || isAssigningRider}
			>
				{#if isAssigningRider}
					Assigning...
				{:else}
					Assign {selectedRider?.name || 'Rider'}
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
