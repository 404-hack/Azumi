<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import {
		MapPin,
		Clock,
		DollarSign,
		Package,
		Star,
		Calendar,
		Filter,
		Search,
		ChevronRight
	} from 'lucide-svelte';
	import { formatCurrency, formatDate, formatTime } from '$lib/utils';

	// Static order history data
	const orderHistory = [
		{
			id: 'order-001',
			code: 'ORD-2024-001',
			status: 'COMPLETED',
			totalAmount: 4500,
			earnings: 675, // 15% commission
			completedAt: '2024-12-20T18:30:00Z',
			pickupLocation: {
				name: 'KFC Victoria Island',
				address: '12 Ahmadu Bello Way, Victoria Island, Lagos'
			},
			deliveryLocation: {
				name: 'Sarah Johnson',
				address: '15 Banana Island Road, Ikoyi, Lagos'
			},
			distance: '3.2 km',
			duration: '25 mins',
			rating: 5,
			items: [
				{ name: 'Zinger Burger Meal', quantity: 2, price: 2200 },
				{ name: 'Hot Wings (6pcs)', quantity: 1, price: 1500 },
				{ name: 'Coca Cola 50cl', quantity: 2, price: 800 }
			]
		},
		{
			id: 'order-002',
			code: 'ORD-2024-002',
			status: 'COMPLETED',
			totalAmount: 2800,
			earnings: 420,
			completedAt: '2024-12-20T16:15:00Z',
			pickupLocation: {
				name: 'Chicken Republic Lekki',
				address: '15 Admiralty Way, Lekki Phase 1, Lagos'
			},
			deliveryLocation: {
				name: 'Mike Adebayo',
				address: '8 Chevron Drive, Lekki, Lagos'
			},
			distance: '2.1 km',
			duration: '18 mins',
			rating: 4,
			items: [
				{ name: 'Refuel Max', quantity: 1, price: 1800 },
				{ name: 'Chicken Wrap', quantity: 1, price: 1000 }
			]
		},
		{
			id: 'order-003',
			code: 'ORD-2024-003',
			status: 'COMPLETED',
			totalAmount: 6200,
			earnings: 930,
			completedAt: '2024-12-20T14:45:00Z',
			pickupLocation: {
				name: 'Dominos Pizza',
				address: '42 Adeola Odeku Street, Victoria Island, Lagos'
			},
			deliveryLocation: {
				name: 'Amara Okafor',
				address: '33 Bourdillon Road, Ikoyi, Lagos'
			},
			distance: '4.5 km',
			duration: '32 mins',
			rating: 5,
			items: [
				{ name: 'Large Pepperoni Pizza', quantity: 1, price: 3500 },
				{ name: 'Medium Margherita Pizza', quantity: 1, price: 2700 }
			]
		},
		{
			id: 'order-004',
			code: 'ORD-2024-004',
			status: 'COMPLETED',
			totalAmount: 3400,
			earnings: 510,
			completedAt: '2024-12-19T19:20:00Z',
			pickupLocation: {
				name: 'Mr Biggs Ikeja',
				address: '23 Obafemi Awolowo Way, Ikeja, Lagos'
			},
			deliveryLocation: {
				name: 'John Smith',
				address: '45 Allen Avenue, Ikeja, Lagos'
			},
			distance: '1.8 km',
			duration: '15 mins',
			rating: 4,
			items: [
				{ name: 'Chicken & Chips', quantity: 2, price: 2400 },
				{ name: 'Meat Pie', quantity: 2, price: 1000 }
			]
		},
		{
			id: 'order-005',
			code: 'ORD-2024-005',
			status: 'COMPLETED',
			totalAmount: 1800,
			earnings: 270,
			completedAt: '2024-12-19T17:10:00Z',
			pickupLocation: {
				name: 'Tasty Fried Chicken',
				address: '12 Bode Thomas Street, Surulere, Lagos'
			},
			deliveryLocation: {
				name: 'Grace Nkem',
				address: '8 Ojuelegba Road, Surulere, Lagos'
			},
			distance: '1.2 km',
			duration: '12 mins',
			rating: 3,
			items: [
				{ name: 'Fried Chicken (2pcs)', quantity: 1, price: 1200 },
				{ name: 'Jollof Rice', quantity: 1, price: 600 }
			]
		}
	];

	let selectedFilter = $state('all');
	let searchQuery = $state('');

	const totalEarnings = orderHistory.reduce((sum, order) => sum + order.earnings, 0);
	const totalOrders = orderHistory.length;
	const averageRating =
		orderHistory.reduce((sum, order) => sum + order.rating, 0) / orderHistory.length;

	function getStatusColor(status: string) {
		switch (status) {
			case 'COMPLETED':
				return 'bg-green-100 text-green-800';
			case 'CANCELLED':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getRatingStars(rating: number) {
		return Array.from({ length: 5 }, (_, i) => i < rating);
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Order History</h1>
			<p class="text-gray-600">View all your completed deliveries</p>
		</div>
	</div>

	<!-- Stats Cards -->
	<div class="grid gap-4 md:grid-cols-3">
		<div class="rounded-lg bg-white p-6 shadow-sm">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
					<DollarSign class="h-5 w-5 text-green-600" />
				</div>
				<div>
					<p class="text-sm text-gray-600">Total Earnings</p>
					<p class="text-xl font-bold text-green-600">{formatCurrency(totalEarnings)}</p>
				</div>
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow-sm">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
					<Package class="h-5 w-5 text-blue-600" />
				</div>
				<div>
					<p class="text-sm text-gray-600">Total Orders</p>
					<p class="text-xl font-bold text-blue-600">{totalOrders}</p>
				</div>
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow-sm">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
					<Star class="h-5 w-5 text-yellow-600" />
				</div>
				<div>
					<p class="text-sm text-gray-600">Average Rating</p>
					<p class="text-xl font-bold text-yellow-600">{averageRating.toFixed(1)}</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="rounded-lg bg-white p-4 shadow-sm">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex gap-2">
				<Button
					variant={selectedFilter === 'all' ? 'default' : 'outline'}
					size="sm"
					onclick={() => (selectedFilter = 'all')}
				>
					All Orders
				</Button>
				<Button
					variant={selectedFilter === 'today' ? 'default' : 'outline'}
					size="sm"
					onclick={() => (selectedFilter = 'today')}
				>
					Today
				</Button>
				<Button
					variant={selectedFilter === 'week' ? 'default' : 'outline'}
					size="sm"
					onclick={() => (selectedFilter = 'week')}
				>
					This Week
				</Button>
			</div>

			<div class="relative">
				<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
				<input
					type="text"
					placeholder="Search orders..."
					bind:value={searchQuery}
					class="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-64"
				/>
			</div>
		</div>
	</div>

	<!-- Order List -->
	<div class="space-y-4">
		{#each orderHistory as order}
			<div class="rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
				<div class="flex items-start justify-between">
					<div class="flex-1">
						<!-- Order Header -->
						<div class="mb-4 flex items-center justify-between">
							<div class="flex items-center gap-3">
								<h3 class="font-semibold text-gray-900">{order.code}</h3>
								<Badge class={getStatusColor(order.status)}>
									{order.status}
								</Badge>
							</div>
							<div class="text-right">
								<p class="font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</p>
								<p class="text-sm text-green-600">Earned: {formatCurrency(order.earnings)}</p>
							</div>
						</div>

						<!-- Order Details -->
						<div class="grid gap-4 md:grid-cols-2">
							<!-- Pickup & Delivery -->
							<div class="space-y-3">
								<div class="flex items-start gap-3">
									<div class="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100">
										<MapPin class="h-3 w-3 text-orange-600" />
									</div>
									<div class="flex-1">
										<p class="text-sm font-medium text-gray-900">{order.pickupLocation.name}</p>
										<p class="text-xs text-gray-600">{order.pickupLocation.address}</p>
									</div>
								</div>

								<div class="flex items-start gap-3">
									<div class="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
										<MapPin class="h-3 w-3 text-green-600" />
									</div>
									<div class="flex-1">
										<p class="text-sm font-medium text-gray-900">{order.deliveryLocation.name}</p>
										<p class="text-xs text-gray-600">{order.deliveryLocation.address}</p>
									</div>
								</div>
							</div>

							<!-- Order Info -->
							<div class="space-y-2">
								<div class="flex items-center gap-2 text-sm text-gray-600">
									<Clock class="h-4 w-4" />
									<span
										>Completed: {formatDate(order.completedAt)} at {formatTime(
											order.completedAt
										)}</span
									>
								</div>
								<div class="flex items-center gap-2 text-sm text-gray-600">
									<MapPin class="h-4 w-4" />
									<span>{order.distance} • {order.duration}</span>
								</div>
								<div class="flex items-center gap-2">
									<div class="flex items-center gap-1">
										{#each getRatingStars(order.rating) as filled}
											<Star
												class="h-4 w-4 {filled
													? 'fill-yellow-400 text-yellow-400'
													: 'text-gray-300'}"
											/>
										{/each}
									</div>
									<span class="text-sm text-gray-600">({order.rating}.0)</span>
								</div>
							</div>
						</div>

						<!-- Order Items Preview -->
						<div class="mt-4 border-t pt-4">
							<p class="mb-2 text-sm text-gray-600">
								{order.items.length} item{order.items.length !== 1 ? 's' : ''}:
							</p>
							<div class="flex flex-wrap gap-2">
								{#each order.items.slice(0, 3) as item}
									<span
										class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"
									>
										{item.quantity}x {item.name}
									</span>
								{/each}
								{#if order.items.length > 3}
									<span
										class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
									>
										+{order.items.length - 3} more
									</span>
								{/if}
							</div>
						</div>
					</div>

					<!-- View Details Button -->
					<div class="ml-4">
						<Button variant="outline" size="sm" href="/rider/orders/{order.id}">
							<span class="sr-only">View details</span>
							<ChevronRight class="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Empty State (if no orders) -->
	{#if orderHistory.length === 0}
		<div class="rounded-lg bg-white p-12 text-center shadow-sm">
			<Package class="mx-auto h-12 w-12 text-gray-400" />
			<h3 class="mt-4 text-lg font-medium text-gray-900">No orders yet</h3>
			<p class="mt-2 text-gray-600">Your completed deliveries will appear here</p>
		</div>
	{/if}
</div>
