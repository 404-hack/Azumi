<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import {
		ArrowLeft,
		MapPin,
		Clock,
		DollarSign,
		Package,
		Phone,
		Navigation,
		User,
		Store,
		Receipt,
		CheckCircle,
		Truck
	} from 'lucide-svelte';
	import { formatCurrency, formatDate, formatTime, formatDateTime } from '$lib/utils';
	import type { OrderDetails } from '$lib/services/riderOrderService';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { client } from '$lib/hc';

	const { data } = $props();
	const order: OrderDetails = data.order;

	let isUpdatingStatus = $state(false);
	let confirmationCode = $state('');
	let showDeliveryDialog = $state(false);

	function getStatusColor(status: string) {
		switch (status) {
			case 'COMPLETED':
				return 'bg-green-100 text-green-800';
			case 'DELIVERED':
				return 'bg-blue-100 text-blue-800';
			case 'IN_TRANSIT':
				return 'bg-orange-100 text-orange-800';
			case 'RIDER_ASSIGNED':
				return 'bg-purple-100 text-purple-800';
			case 'READY':
				return 'bg-yellow-100 text-yellow-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function openMaps(lat: number, lng: number, address?: string) {
		const query = address ? encodeURIComponent(address) : `${lat},${lng}`;
		const mapsUrl = `https://maps.google.com?q=${query}`;
		window.open(mapsUrl, '_blank');
	}

	function callNumber(phone: string) {
		if (phone) {
			window.location.href = `tel:${phone}`;
		}
	}
	async function markAsPickedUp() {
		if (isUpdatingStatus) return;

		try {
			isUpdatingStatus = true;
			const response = await client.rider.orders[':id'].pickup.$post({
				param: { id: order.id }
			});

			if (response.ok) {
				toast.success('Order marked as picked up!');
			} else {
				const error = await response.json();
				toast.error(error.error || 'Failed to mark order as picked up');
			}
		} catch (error) {
			console.error('Error marking order as picked up:', error);
			toast.error('Failed to mark order as picked up');
		} finally {
			isUpdatingStatus = false;
		}
	}

	function openDeliveryDialog() {
		showDeliveryDialog = true;
	}
	async function confirmDelivery() {
		if (isUpdatingStatus || !confirmationCode) return;

		try {
			isUpdatingStatus = true;
			const response = await client.rider.orders[':id'].deliver.$post({
				param: { id: order.id },
				json: {
					confirmationCode: parseInt(confirmationCode)
				}
			});

			if (response.ok) {
				toast.success('Order delivered successfully!');
				showDeliveryDialog = false;
			} else {
				const error = await response.json();
				toast.error(error.error || 'Failed to mark order as delivered');
			}
		} catch (error) {
			console.error('Error marking order as delivered:', error);
			toast.error('Failed to mark order as delivered');
		} finally {
			isUpdatingStatus = false;
		}
	}

	const statusAction = $derived(getStatusAction());

	function getStatusAction() {
		switch (order.status) {
			case 'RIDER_ASSIGNED':
				return {
					label: 'Mark as Picked Up',
					action: markAsPickedUp,
					icon: Package,
					variant: 'default' as const
				};
			case 'IN_TRANSIT':
				return {
					label: 'Mark as Delivered',
					action: openDeliveryDialog,
					icon: CheckCircle,
					variant: 'default' as const
				};
			default:
				return null;
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<Button variant="ghost" size="sm" href="/rider/orders/history">
			<ArrowLeft class="h-4 w-4" />
		</Button>
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Order Details</h1>
			<p class="text-gray-600">{order.code || `Order #${order.id.slice(-6)}`}</p>
		</div>
	</div>

	<div class="grid gap-6 lg:grid-cols-3">
		<!-- Main Content -->
		<div class="space-y-6 lg:col-span-2">
			<!-- Order Status -->
			<div class="rounded-lg bg-white p-6 shadow-sm">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-lg font-semibold text-gray-900">Order Status</h2>
					<Badge class={getStatusColor(order.status)}>
						{order.status}
					</Badge>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<p class="text-sm text-gray-600">Total Amount</p>
						<p class="text-xl font-bold text-gray-900">
							{formatCurrency(order.total)}
						</p>
					</div>
					<div>
						<p class="text-sm text-gray-600">Delivery Fee</p>
						<p class="text-xl font-bold text-green-600">{formatCurrency(order.deliveryFee || 0)}</p>
					</div>
					{#if order.estimatedDistance}
						<div>
							<p class="text-sm text-gray-600">Distance</p>
							<p class="font-medium text-gray-900">{order.estimatedDistance.toFixed(1)} km</p>
						</div>
					{/if}
					{#if order.estimatedDuration}
						<div>
							<p class="text-sm text-gray-600">Estimated Duration</p>
							<p class="font-medium text-gray-900">
								{Math.round(order.estimatedDuration / 60)} mins
							</p>
						</div>
					{/if}
				</div>
				{#if statusAction}
					<div class="mt-6 border-t pt-4">
						<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<p class="text-sm text-gray-600">Next Action</p>
								<p class="text-sm font-medium text-gray-900">
									{statusAction.label}
								</p>
							</div>
							<Button
								variant={statusAction.variant}
								size="lg"
								onclick={statusAction.action}
								disabled={isUpdatingStatus}
								class="w-full sm:w-auto"
							>
								{@const IconComponent = statusAction.icon}
								<IconComponent class="mr-2 h-4 w-4" />
								{isUpdatingStatus ? 'Updating...' : statusAction.label}
							</Button>
						</div>
					</div>
				{/if}
			</div>
			<!-- Order Summary -->
			<div class="rounded-lg bg-white p-6 shadow-sm">
				<h2 class="mb-4 text-lg font-semibold text-gray-900">Order Summary</h2>
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<span class="text-gray-600">Order Total</span>
						<span class="font-medium text-gray-900">{formatCurrency(order.total)}</span>
					</div>
					{#if order.deliveryFee}
						<div class="flex items-center justify-between">
							<span class="text-gray-600">Delivery Fee</span>
							<span class="font-medium text-gray-900">{formatCurrency(order.deliveryFee)}</span>
						</div>
					{/if}
					{#if order.specialInstructions}
						<div class="border-t pt-4">
							<p class="mb-2 text-sm text-gray-600">Special Instructions</p>
							<p class="rounded-lg bg-gray-50 p-3 text-gray-900">{order.specialInstructions}</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Order Items -->
			{#if order.items && order.items.length > 0}
				<div class="rounded-lg bg-white p-6 shadow-sm">
					<h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
						<Receipt class="h-5 w-5" />
						Order Items
					</h2>
					<div class="space-y-4">
						{#each order.items as item}
							<div class="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
								<div class="flex items-start gap-4">
									{#if item.menuItem?.imageUrl}
										<img
											src={item.menuItem.imageUrl}
											alt={item.menuItemName}
											class="h-16 w-16 rounded-lg object-cover"
										/>
									{:else}
										<div class="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100">
											<Package class="h-6 w-6 text-gray-400" />
										</div>
									{/if}
									<div class="min-w-0 flex-1">
										<div class="flex items-start justify-between">
											<div class="flex-1">
												<h3 class="truncate font-medium text-gray-900">
													{item.menuItem?.name || item.menuItemName}
												</h3>
												{#if item.menuItem?.description}
													<p class="mt-1 line-clamp-2 text-sm text-gray-600">
														{item.menuItem.description}
													</p>
												{/if}
												<div class="mt-2 flex items-center gap-4">
													<span class="text-sm text-gray-600">
														Qty: {item.quantity}
													</span>
													<span class="text-sm font-medium text-gray-900">
														{formatCurrency(item.totalPrice)}
													</span>
												</div>
											</div>
										</div>

										<!-- Item Options -->
										{#if item.options && item.options.length > 0}
											<div class="mt-3 space-y-2">
												<p class="text-sm font-medium text-gray-700">Options:</p>
												<div class="grid gap-2">
													{#each item.options as option}
														<div class="flex items-center justify-between text-sm">
															<div class="flex items-center gap-2">
																<span class="text-gray-600">
																	{option.optionGroup?.name || 'Option'}:
																</span>
																<span class="text-gray-900">
																	{option.option?.name || option.optionName}
																</span>
																{#if option.quantity && option.quantity > 1}
																	<span class="text-gray-500">
																		(×{option.quantity})
																	</span>
																{/if}
															</div>
															<span class="font-medium text-gray-700">
																+{formatCurrency(option.price * (option.quantity || 1))}
															</span>
														</div>
													{/each}
												</div>
											</div>
										{/if}

										<!-- Item Special Instructions -->
										{#if item.specialInstructions}
											<div class="mt-3">
												<p class="mb-1 text-sm font-medium text-gray-700">Special Instructions:</p>
												<p
													class="rounded border border-amber-200 bg-amber-50 p-2 text-sm text-gray-600"
												>
													{item.specialInstructions}
												</p>
											</div>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Basic Timeline -->
			<div class="rounded-lg bg-white p-6 shadow-sm">
				<h2 class="mb-4 text-lg font-semibold text-gray-900">Order Information</h2>
				<div class="space-y-4">
					{#if order.createdAt}
						<div class="flex items-start gap-3">
							<div
								class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100"
							>
								<div class="h-2 w-2 rounded-full bg-blue-600"></div>
							</div>
							<div class="flex-1">
								<p class="text-sm font-medium text-gray-900">Order Created</p>
								<p class="text-xs text-gray-600">{formatDateTime(order.createdAt)}</p>
							</div>
						</div>
					{/if}
					<div class="flex items-start gap-3">
						<div
							class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100"
						>
							<div class="h-2 w-2 rounded-full bg-green-600"></div>
						</div>
						<div class="flex-1">
							<p class="text-sm font-medium text-gray-900">Current Status</p>
							<p class="text-xs text-gray-600">{order.status}</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Sidebar -->
		<div class="space-y-6">
			<!-- Pickup Location -->
			<div class="rounded-lg bg-white p-6 shadow-sm">
				<div class="mb-4 flex items-center gap-2">
					<Store class="h-5 w-5 text-orange-600" />
					<h3 class="font-semibold text-gray-900">Pickup Location</h3>
				</div>
				<div class="space-y-3">
					<div>
						<p class="font-medium text-gray-900">{order.shop.name}</p>
						<p class="text-sm text-gray-600">{order.shop.address || 'Address not available'}</p>
					</div>
					<div class="flex gap-2">
						{#if order.shop.phoneNumber}
							<Button
								variant="outline"
								size="sm"
								onclick={() => callNumber(order.shop.phoneNumber || '')}
							>
								<Phone class="mr-1 h-3 w-3" />
								Call
							</Button>
						{/if}
						{#if order.shop.latitude && order.shop.longitude}
							<Button
								variant="outline"
								size="sm"
								onclick={() =>
									openMaps(
										order.shop.latitude || 0,
										order.shop.longitude || 0,
										order.shop.address || ''
									)}
							>
								<Navigation class="mr-1 h-3 w-3" />
								Maps
							</Button>
						{/if}
					</div>
				</div>
			</div>
			<!-- Delivery Location -->
			<div class="rounded-lg bg-white p-6 shadow-sm">
				<div class="mb-4 flex items-center gap-2">
					<User class="h-5 w-5 text-green-600" />
					<h3 class="font-semibold text-gray-900">Delivery Location</h3>
				</div>
				<div class="space-y-3">
					<div>
						<p class="font-medium text-gray-900">{order.customer?.name || 'Customer'}</p>
						<p class="text-sm text-gray-600">
							{order.addressName || `${order.latitude.toFixed(6)}, ${order.longitude.toFixed(6)}`}
						</p>
					</div>
					<div class="flex gap-2">
						{#if order.customer?.phoneNumber}
							<Button
								variant="outline"
								size="sm"
								onclick={() => callNumber(order.customer?.phoneNumber || '')}
							>
								<Phone class="mr-1 h-3 w-3" />
								Call
							</Button>
						{/if}
						<Button
							variant="outline"
							size="sm"
							onclick={() =>
								openMaps(order.latitude, order.longitude, order.addressName || undefined)}
						>
							<Navigation class="mr-1 h-3 w-3" />
							Maps
						</Button>
					</div>
				</div>
			</div>

			<!-- Order Info -->
			<div class="rounded-lg bg-white p-6 shadow-sm">
				<div class="mb-4 flex items-center gap-2">
					<Clock class="h-5 w-5 text-blue-600" />
					<h3 class="font-semibold text-gray-900">Order Info</h3>
				</div>
				<div class="space-y-3">
					<div class="flex justify-between text-sm">
						<span class="text-gray-600">Order ID:</span>
						<span class="font-mono text-xs text-gray-900">{order.id.slice(-8)}</span>
					</div>
					{#if order.createdAt}
						<div class="flex justify-between text-sm">
							<span class="text-gray-600">Created:</span>
							<span class="text-gray-900">{formatTime(order.createdAt)}</span>
						</div>
					{/if}
				</div>
			</div>

			<!-- Payment Info -->
			<div class="rounded-lg bg-white p-6 shadow-sm">
				<div class="mb-4 flex items-center gap-2">
					<Receipt class="h-5 w-5 text-green-600" />
					<h3 class="font-semibold text-gray-900">Payment</h3>
				</div>
				<div class="space-y-3">
					<div class="flex justify-between text-sm">
						<span class="text-gray-600">Order Value:</span>
						<span class="text-gray-900">{formatCurrency(order.total)}</span>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-gray-600">Delivery Fee:</span>
						<span class="text-green-600">{formatCurrency(order.deliveryFee || 0)}</span>
					</div>
					<div class="border-t pt-3">
						<div class="flex justify-between font-medium">
							<span class="text-gray-900">Total Amount:</span>
							<span class="text-green-600">{formatCurrency(order.total)}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Delivery Confirmation Dialog -->
{#if showDeliveryDialog}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
		<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
			<h3 class="mb-4 text-lg font-semibold text-gray-900">Confirm Delivery</h3>
			<p class="mb-4 text-sm text-gray-600">
				Enter the confirmation code provided by the customer to complete the delivery.
			</p>
			<div class="mb-4">
				<label for="confirmationCode" class="mb-2 block text-sm font-medium text-gray-700">
					Confirmation Code
				</label>
				<input
					id="confirmationCode"
					type="number"
					bind:value={confirmationCode}
					placeholder="Enter 4-digit code"
					class="w-full rounded-md border border-gray-300 px-3 py-2 text-center font-mono text-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
					maxlength="4"
				/>
			</div>
			<div class="flex gap-3">
				<Button
					variant="outline"
					onclick={() => {
						showDeliveryDialog = false;
						confirmationCode = '';
					}}
					class="flex-1"
					disabled={isUpdatingStatus}
				>
					Cancel
				</Button>
				<Button
					onclick={confirmDelivery}
					class="flex-1"
					disabled={isUpdatingStatus || !confirmationCode}
				>
					{isUpdatingStatus ? 'Confirming...' : 'Confirm Delivery'}
				</Button>
			</div>
		</div>
	</div>
{/if}
