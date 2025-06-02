<script lang="ts">
	import { cn } from '$lib/utils';
	import { riderDispatchState } from '$lib/states/riderDispatchState.svelte';
	import { orderAcceptanceState } from '$lib/states/orderAcceptanceState.svelte';

	interface Props {
		class?: string;
	}

	let { class: className }: Props = $props();

	function formatTime(seconds: number): string {
		if (seconds <= 0) return '0:00';
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function formatCurrency(amount: number): string {
		return `₦${amount.toLocaleString()}`;
	}

	function getUrgencyClass(timeLeft: number): string {
		if (timeLeft <= 10) return 'border-red-500 bg-red-50';
		if (timeLeft <= 15) return 'border-orange-500 bg-orange-50';
		return 'border-gray-200 bg-white';
	}

	function handleOrderClick(order: any) {
		orderAcceptanceState.showOrderOffer(order);
	}
</script>

<div class={cn("p-4", className)}>
	<h2 class="text-lg font-semibold mb-4">Available Orders</h2>
	
	{#if riderDispatchState.availableOrders.length === 0}
		<div class="text-center py-8 text-gray-500">
			<p>No orders available at the moment</p>
			<p class="text-sm">We'll notify you when new orders come in!</p>
		</div>
	{:else}
		<div class="space-y-3">			{#each riderDispatchState.availableOrders as order (order.id)}
				<button 
					class={cn(
						"w-full p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md text-left",
						getUrgencyClass(order.timeLeftSeconds || 30)
					)}
					onclick={() => handleOrderClick(order)}
				>
					<div class="flex justify-between items-start mb-2">
						<div class="flex-1">
							<div class="flex items-center gap-2 mb-1">
								<span class="font-medium">Order #{order.id.slice(-6)}</span>
								<span class="text-sm text-gray-500">• {order.itemCount} items</span>
							</div>
							<div class="text-sm text-gray-600">
								<div>📍 {order.pickupLocation.address}</div>
								<div>📦 {order.deliveryLocation.address}</div>
							</div>
						</div>
								<div class="text-right">
							<div class={cn(
								"text-lg font-bold px-2 py-1 rounded",
								(order.timeLeftSeconds || 30) <= 10 ? "text-red-600 bg-red-100" :
								(order.timeLeftSeconds || 30) <= 15 ? "text-orange-600 bg-orange-100" :
								"text-green-600 bg-green-100"
							)}>
								{formatTime(order.timeLeftSeconds || 30)}
							</div>
							<div class="text-sm text-gray-500 mt-1">
								{formatCurrency(order.deliveryFee)}
							</div>
						</div>
					</div>
					
					<div class="flex justify-between items-center text-sm">
						<span class="text-gray-600">
							{order.estimatedDistance.toFixed(1)}km • {order.estimatedDuration}min
						</span>
						<span class="font-medium text-green-600">
							{formatCurrency(order.orderValue)}						</span>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
