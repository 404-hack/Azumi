<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { riderDispatchState } from '$lib/states/riderDispatchState.svelte';
	import {
		MapPin,
		Clock,
		DollarSign,
		Package,
		Navigation,
		Phone,
		AlertCircle,
		CheckCircle,
		X
	} from 'lucide-svelte';
	import { formatCurrency } from '$lib/utils';

	interface Props {
		order: {
			id: string;
			shopId: string;
			pickupLocation: {
				lat: number;
				lng: number;
				address: string;
			};
			deliveryLocation: {
				lat: number;
				lng: number;
				address: string;
			};
			orderValue: number;
			deliveryFee: number;
			estimatedDistance: number;
			estimatedDuration: number;
			itemCount: number;
			createdAt: string;
			expiresAt: string;
		};
	}

	let { order }: Props = $props();

	let isAccepting = $state(false);
	let timeRemaining = $state('');

	function calculateTimeRemaining() {
		const now = new Date().getTime();
		const expiry = new Date(order.expiresAt).getTime();
		const diff = expiry - now;

		if (diff <= 0) {
			timeRemaining = 'Expired';
			riderDispatchState.rejectOrder(order.id);
			return;
		}

		const minutes = Math.floor(diff / 60000);
		const seconds = Math.floor((diff % 60000) / 1000);
		timeRemaining = `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}

	$effect(() => {
		calculateTimeRemaining();
		const interval = setInterval(calculateTimeRemaining, 1000);
		return () => clearInterval(interval);
	});

	async function handleAccept() {
		if (isAccepting) return;

		isAccepting = true;
		try {
			await riderDispatchState.acceptOrder(order.id);
		} catch (error) {
			console.error('Failed to accept order:', error);
		} finally {
			isAccepting = false;
		}
	}

	function handleReject() {
		riderDispatchState.rejectOrder(order.id);
	}

	function openMaps() {
		const url = `https://www.google.com/maps/dir/?api=1&destination=${order.pickupLocation.lat},${order.pickupLocation.lng}`;
		window.open(url, '_blank');
	}
</script>

<Card class="border-2 border-blue-200 bg-blue-50 p-6">
	<div class="flex items-start justify-between">
		<div class="flex items-center gap-3">
			<div class="rounded-full bg-blue-100 p-2">
				<Package class="h-5 w-5 text-blue-600" />
			</div>
			<div>
				<h3 class="font-semibold">New Delivery Available</h3>
				<p class="text-sm text-muted-foreground">Order #{order.id.slice(-8)}</p>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<Badge
				variant="outline"
				class={timeRemaining === 'Expired'
					? 'border-red-500 text-red-600'
					: 'border-orange-500 text-orange-600'}
			>
				<Clock class="mr-1 h-3 w-3" />
				{timeRemaining}
			</Badge>
		</div>
	</div>

	<div class="mt-4 grid gap-4 sm:grid-cols-2">
		<div class="space-y-3">
			<div class="rounded-lg border bg-white p-3">
				<div class="flex items-start gap-2">
					<MapPin class="mt-1 h-4 w-4 text-green-600" />
					<div class="min-w-0 flex-1">
						<p class="text-sm font-medium">Pickup</p>
						<p class="text-sm text-muted-foreground">{order.pickupLocation.address}</p>
					</div>
				</div>
			</div>

			<div class="rounded-lg border bg-white p-3">
				<div class="flex items-start gap-2">
					<MapPin class="mt-1 h-4 w-4 text-red-600" />
					<div class="min-w-0 flex-1">
						<p class="text-sm font-medium">Delivery</p>
						<p class="text-sm text-muted-foreground">{order.deliveryLocation.address}</p>
					</div>
				</div>
			</div>
		</div>

		<div class="space-y-3">
			<div class="grid grid-cols-2 gap-3">
				<div class="rounded-lg border bg-white p-3 text-center">
					<DollarSign class="mx-auto h-4 w-4 text-green-600" />
					<p class="text-sm font-medium">{formatCurrency(order.deliveryFee)}</p>
					<p class="text-xs text-muted-foreground">Delivery Fee</p>
				</div>

				<div class="rounded-lg border bg-white p-3 text-center">
					<Navigation class="mx-auto h-4 w-4 text-blue-600" />
					<p class="text-sm font-medium">{order.estimatedDistance.toFixed(1)} km</p>
					<p class="text-xs text-muted-foreground">Distance</p>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<div class="rounded-lg border bg-white p-3 text-center">
					<Clock class="mx-auto h-4 w-4 text-orange-600" />
					<p class="text-sm font-medium">{order.estimatedDuration} min</p>
					<p class="text-xs text-muted-foreground">Est. Time</p>
				</div>

				<div class="rounded-lg border bg-white p-3 text-center">
					<Package class="mx-auto h-4 w-4 text-purple-600" />
					<p class="text-sm font-medium">{order.itemCount}</p>
					<p class="text-xs text-muted-foreground">Items</p>
				</div>
			</div>
		</div>
	</div>

	<div class="mt-6 flex gap-2">
		<Button variant="outline" size="sm" onclick={handleReject} class="flex-1 gap-2">
			<X class="h-4 w-4" />
			Reject
		</Button>

		<Button variant="outline" size="sm" onclick={openMaps} class="gap-2">
			<Navigation class="h-4 w-4" />
			Directions
		</Button>

		<Button
			size="sm"
			onclick={handleAccept}
			disabled={isAccepting || timeRemaining === 'Expired'}
			class="flex-1 gap-2"
		>
			{#if isAccepting}
				<div
					class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
				></div>
				Accepting...
			{:else}
				<CheckCircle class="h-4 w-4" />
				Accept Order
			{/if}
		</Button>
	</div>
</Card>
