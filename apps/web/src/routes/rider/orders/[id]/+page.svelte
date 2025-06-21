<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import {
		ArrowLeft,
		MapPin,
		Clock,
		DollarSign,
		Package,
		Star,
		Phone,
		Navigation,
		User,
		Store,
		Receipt,
		Calendar
	} from 'lucide-svelte';
	import { formatCurrency, formatDate, formatTime, formatDateTime } from '$lib/utils';

	// Get order ID from URL params
	const orderId = page.params.id;

	// Static order data - in real app this would come from API
	const orderDetails = {
		id: 'order-001',
		code: 'ORD-2024-001',
		status: 'COMPLETED',
		totalAmount: 4500,
		subtotal: 4000,
		deliveryFee: 500,
		earnings: 675, // 15% commission
		completedAt: '2024-12-20T18:30:00Z',
		createdAt: '2024-12-20T17:45:00Z',
		riderAssignedAt: '2024-12-20T17:50:00Z',
		pickedUpAt: '2024-12-20T18:05:00Z',
		deliveredAt: '2024-12-20T18:30:00Z',
		pickupLocation: {
			name: 'KFC Victoria Island',
			address: '12 Ahmadu Bello Way, Victoria Island, Lagos',
			phone: '+234 813 456 7890',
			coordinates: { lat: 6.4281, lng: 3.4219 }
		},
		deliveryLocation: {
			name: 'Sarah Johnson',
			address: '15 Banana Island Road, Ikoyi, Lagos',
			phone: '+234 901 234 5678',
			coordinates: { lat: 6.4474, lng: 3.4553 }
		},
		customer: {
			name: 'Sarah Johnson',
			phone: '+234 901 234 5678',
			email: 'sarah.johnson@email.com'
		},
		distance: '3.2 km',
		duration: '25 mins',
		rating: 5,
		customerFeedback: 'Excellent service! Food arrived hot and on time. Very professional rider.',
		items: [
			{
				id: 1,
				name: 'Zinger Burger Meal',
				description: 'Spicy chicken burger with fries and drink',
				quantity: 2,
				unitPrice: 1100,
				totalPrice: 2200,
				image: 'https://placehold.co/80x80?text=Burger',
				options: [
					{ name: 'Extra Spicy', price: 0 },
					{ name: 'Large Fries', price: 100 }
				]
			},
			{
				id: 2,
				name: 'Hot Wings (6pcs)',
				description: 'Crispy chicken wings with special sauce',
				quantity: 1,
				unitPrice: 1500,
				totalPrice: 1500,
				image: 'https://placehold.co/80x80?text=Wings',
				options: []
			},
			{
				id: 3,
				name: 'Coca Cola 50cl',
				description: 'Chilled soft drink',
				quantity: 2,
				unitPrice: 400,
				totalPrice: 800,
				image: 'https://placehold.co/80x80?text=Coke',
				options: []
			}
		],
		timeline: [
			{ time: '2024-12-20T17:45:00Z', event: 'Order placed', status: 'PENDING' },
			{ time: '2024-12-20T17:48:00Z', event: 'Payment confirmed', status: 'PAYMENT_CONFIRMED' },
			{ time: '2024-12-20T17:49:00Z', event: 'Order confirmed by restaurant', status: 'CONFIRMED' },
			{ time: '2024-12-20T17:50:00Z', event: 'Rider assigned', status: 'RIDER_ASSIGNED' },
			{ time: '2024-12-20T18:00:00Z', event: 'Food ready for pickup', status: 'READY' },
			{ time: '2024-12-20T18:05:00Z', event: 'Order picked up', status: 'IN_TRANSIT' },
			{ time: '2024-12-20T18:30:00Z', event: 'Order delivered', status: 'DELIVERED' },
			{ time: '2024-12-20T18:32:00Z', event: 'Order completed', status: 'COMPLETED' }
		]
	};

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
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getRatingStars(rating: number) {
		return Array.from({ length: 5 }, (_, i) => i < rating);
	}

	function openMaps(address: string) {
		const mapsUrl = `https://maps.google.com?q=${encodeURIComponent(address)}`;
		window.open(mapsUrl, '_blank');
	}

	function callNumber(phone: string) {
		window.location.href = `tel:${phone}`;
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
			<p class="text-gray-600">{orderDetails.code}</p>
		</div>
	</div>

	<div class="grid gap-6 lg:grid-cols-3">
		<!-- Main Content -->
		<div class="space-y-6 lg:col-span-2">
			<!-- Order Status -->
			<div class="rounded-lg bg-white p-6 shadow-sm">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-lg font-semibold text-gray-900">Order Status</h2>
					<Badge class={getStatusColor(orderDetails.status)}>
						{orderDetails.status}
					</Badge>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<p class="text-sm text-gray-600">Total Amount</p>
						<p class="text-xl font-bold text-gray-900">
							{formatCurrency(orderDetails.totalAmount)}
						</p>
					</div>
					<div>
						<p class="text-sm text-gray-600">Your Earnings</p>
						<p class="text-xl font-bold text-green-600">{formatCurrency(orderDetails.earnings)}</p>
					</div>
					<div>
						<p class="text-sm text-gray-600">Distance</p>
						<p class="font-medium text-gray-900">{orderDetails.distance}</p>
					</div>
					<div>
						<p class="text-sm text-gray-600">Duration</p>
						<p class="font-medium text-gray-900">{orderDetails.duration}</p>
					</div>
				</div>
			</div>

			<!-- Order Items -->
			<div class="rounded-lg bg-white p-6 shadow-sm">
				<h2 class="mb-4 text-lg font-semibold text-gray-900">Order Items</h2>
				<div class="space-y-4">
					{#each orderDetails.items as item}
						<div class="flex gap-4 border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
							<div class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
								<img src={item.image} alt={item.name} class="h-full w-full object-cover" />
							</div>
							<div class="flex-1">
								<div class="flex items-start justify-between">
									<div>
										<h3 class="font-medium text-gray-900">{item.name}</h3>
										<p class="text-sm text-gray-600">{item.description}</p>
										{#if item.options.length > 0}
											<div class="mt-1 space-y-1">
												{#each item.options as option}
													<p class="text-xs text-gray-500">
														+ {option.name}
														{option.price > 0 ? `(${formatCurrency(option.price)})` : ''}
													</p>
												{/each}
											</div>
										{/if}
									</div>
									<div class="text-right">
										<p class="font-medium text-gray-900">{formatCurrency(item.totalPrice)}</p>
										<p class="text-sm text-gray-600">Qty: {item.quantity}</p>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>

				<!-- Order Summary -->
				<div class="mt-6 border-t pt-4">
					<div class="space-y-2">
						<div class="flex justify-between text-sm">
							<span class="text-gray-600">Subtotal</span>
							<span class="text-gray-900">{formatCurrency(orderDetails.subtotal)}</span>
						</div>
						<div class="flex justify-between text-sm">
							<span class="text-gray-600">Delivery Fee</span>
							<span class="text-gray-900">{formatCurrency(orderDetails.deliveryFee)}</span>
						</div>
						<div class="flex justify-between border-t pt-2 font-medium">
							<span class="text-gray-900">Total</span>
							<span class="text-gray-900">{formatCurrency(orderDetails.totalAmount)}</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Customer Rating & Feedback -->
			{#if orderDetails.rating}
				<div class="rounded-lg bg-white p-6 shadow-sm">
					<h2 class="mb-4 text-lg font-semibold text-gray-900">Customer Rating</h2>
					<div class="mb-4 flex items-center gap-3">
						<div class="flex items-center gap-1">
							{#each getRatingStars(orderDetails.rating) as filled}
								<Star
									class="h-5 w-5 {filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}"
								/>
							{/each}
						</div>
						<span class="text-lg font-medium text-gray-900">{orderDetails.rating}.0</span>
					</div>
					{#if orderDetails.customerFeedback}
						<div class="rounded-lg bg-gray-50 p-4">
							<p class="text-gray-700">{orderDetails.customerFeedback}</p>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Timeline -->
			<div class="rounded-lg bg-white p-6 shadow-sm">
				<h2 class="mb-4 text-lg font-semibold text-gray-900">Order Timeline</h2>
				<div class="space-y-4">
					{#each orderDetails.timeline as event}
						<div class="flex items-start gap-3">
							<div
								class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100"
							>
								<div class="h-2 w-2 rounded-full bg-blue-600"></div>
							</div>
							<div class="flex-1">
								<p class="text-sm font-medium text-gray-900">{event.event}</p>
								<p class="text-xs text-gray-600">{formatDateTime(event.time)}</p>
							</div>
						</div>
					{/each}
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
						<p class="font-medium text-gray-900">{orderDetails.pickupLocation.name}</p>
						<p class="text-sm text-gray-600">{orderDetails.pickupLocation.address}</p>
					</div>
					<div class="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onclick={() => callNumber(orderDetails.pickupLocation.phone)}
						>
							<Phone class="mr-1 h-3 w-3" />
							Call
						</Button>
						<Button
							variant="outline"
							size="sm"
							onclick={() => openMaps(orderDetails.pickupLocation.address)}
						>
							<Navigation class="mr-1 h-3 w-3" />
							Maps
						</Button>
					</div>
				</div>
			</div>

			<!-- Delivery Location -->
			<div class="rounded-lg bg-white p-6 shadow-sm">
				<div class="mb-4 flex items-center gap-2">
					<User class="h-5 w-5 text-green-600" />
					<h3 class="font-semibold text-gray-900">Customer</h3>
				</div>
				<div class="space-y-3">
					<div>
						<p class="font-medium text-gray-900">{orderDetails.customer.name}</p>
						<p class="text-sm text-gray-600">{orderDetails.deliveryLocation.address}</p>
					</div>
					<div class="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onclick={() => callNumber(orderDetails.customer.phone)}
						>
							<Phone class="mr-1 h-3 w-3" />
							Call
						</Button>
						<Button
							variant="outline"
							size="sm"
							onclick={() => openMaps(orderDetails.deliveryLocation.address)}
						>
							<Navigation class="mr-1 h-3 w-3" />
							Maps
						</Button>
					</div>
				</div>
			</div>

			<!-- Delivery Info -->
			<div class="rounded-lg bg-white p-6 shadow-sm">
				<div class="mb-4 flex items-center gap-2">
					<Clock class="h-5 w-5 text-blue-600" />
					<h3 class="font-semibold text-gray-900">Delivery Info</h3>
				</div>
				<div class="space-y-3">
					<div class="flex justify-between text-sm">
						<span class="text-gray-600">Order Created:</span>
						<span class="text-gray-900">{formatTime(orderDetails.createdAt)}</span>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-gray-600">Assigned:</span>
						<span class="text-gray-900">{formatTime(orderDetails.riderAssignedAt)}</span>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-gray-600">Picked Up:</span>
						<span class="text-gray-900">{formatTime(orderDetails.pickedUpAt)}</span>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-gray-600">Delivered:</span>
						<span class="text-gray-900">{formatTime(orderDetails.deliveredAt)}</span>
					</div>
				</div>
			</div>

			<!-- Earnings Breakdown -->
			<div class="rounded-lg bg-white p-6 shadow-sm">
				<div class="mb-4 flex items-center gap-2">
					<Receipt class="h-5 w-5 text-green-600" />
					<h3 class="font-semibold text-gray-900">Earnings</h3>
				</div>
				<div class="space-y-3">
					<div class="flex justify-between text-sm">
						<span class="text-gray-600">Order Value:</span>
						<span class="text-gray-900">{formatCurrency(orderDetails.totalAmount)}</span>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-gray-600">Commission (15%):</span>
						<span class="text-green-600">{formatCurrency(orderDetails.earnings)}</span>
					</div>
					<div class="border-t pt-3">
						<div class="flex justify-between font-medium">
							<span class="text-gray-900">You Earned:</span>
							<span class="text-green-600">{formatCurrency(orderDetails.earnings)}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
