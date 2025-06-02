<script lang="ts">
	import { orderAcceptanceState } from '$lib/states/orderAcceptanceState.svelte';
	import { cn } from '$lib/utils';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { MapPin, Clock, DollarSign, Package, Navigation, X } from 'lucide-svelte';
	
	console.log('🎬 OrderAcceptanceModal: Component loaded/mounted');
	
	let { class: className = '' } = $props();
	
	// Add reactive logging to track state changes
	$effect(() => {
		console.log('👁️ OrderAcceptanceModal: isVisible changed to:', orderAcceptanceState.isVisible);
		console.log('📦 OrderAcceptanceModal: currentOrder changed to:', orderAcceptanceState.currentOrder);
	});
</script>

{#if orderAcceptanceState.isVisible && orderAcceptanceState.currentOrder}
	<div 
		class={cn(
			"fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4",
			"animate-in fade-in-0 duration-300",
			className
		)}
	>
		<Card class={cn(
			"w-full max-w-md mx-auto shadow-2xl border-2",
			"animate-in slide-in-from-bottom-4 duration-500",
			orderAcceptanceState.urgencyLevel === 'critical' && "border-red-500 shadow-red-500/20",
			orderAcceptanceState.urgencyLevel === 'urgent' && "border-orange-500 shadow-orange-500/20",
			orderAcceptanceState.urgencyLevel === 'normal' && "border-green-500 shadow-green-500/20"
		)}>
			<CardHeader class="space-y-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<div class={cn(
							"w-3 h-3 rounded-full animate-pulse",
							orderAcceptanceState.urgencyLevel === 'critical' && "bg-red-500",
							orderAcceptanceState.urgencyLevel === 'urgent' && "bg-orange-500",
							orderAcceptanceState.urgencyLevel === 'normal' && "bg-green-500"
						)}></div>
						<CardTitle class="text-lg font-bold">New Order Available</CardTitle>
					</div>
					<Badge variant="secondary" class="text-sm font-mono">
						Order #{orderAcceptanceState.currentOrder.id.slice(-6)}
					</Badge>
				</div>
				
				<div class="text-center">
					<div class={cn(
						"text-4xl font-bold tabular-nums transition-colors duration-300",
						orderAcceptanceState.urgencyLevel === 'critical' && "text-red-600",
						orderAcceptanceState.urgencyLevel === 'urgent' && "text-orange-600",
						orderAcceptanceState.urgencyLevel === 'normal' && "text-green-600"
					)}>
						{orderAcceptanceState.formattedTimeRemaining}s
					</div>
					<p class="text-sm text-muted-foreground">Time to respond</p>
				</div>
			</CardHeader>

			<CardContent class="space-y-4">
				<div class="grid grid-cols-2 gap-3">
					<div class="flex items-center gap-2 text-sm">
						<DollarSign class="w-4 h-4 text-green-600" />
						<span class="font-semibold">₦{orderAcceptanceState.estimatedEarnings}</span>
					</div>
					<div class="flex items-center gap-2 text-sm">
						<Package class="w-4 h-4 text-blue-600" />
						<span>{orderAcceptanceState.currentOrder.itemCount} item{orderAcceptanceState.currentOrder.itemCount === 1 ? '' : 's'}</span>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div class="flex items-center gap-2 text-sm">
						<Navigation class="w-4 h-4 text-purple-600" />
						<span>{orderAcceptanceState.currentOrder.estimatedDistance.toFixed(1)} km</span>
					</div>
					<div class="flex items-center gap-2 text-sm">
						<Clock class="w-4 h-4 text-orange-600" />
						<span>{orderAcceptanceState.currentOrder.estimatedDuration} min</span>
					</div>
				</div>

				<div class="space-y-3">
					<div class="flex items-start gap-2">
						<MapPin class="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
						<div class="min-w-0">
							<p class="text-xs font-medium text-green-700">Pickup</p>
							<p class="text-sm text-muted-foreground truncate">{orderAcceptanceState.currentOrder.pickupLocation.address}</p>
						</div>
					</div>
					
					<div class="flex items-start gap-2">
						<MapPin class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
						<div class="min-w-0">
							<p class="text-xs font-medium text-blue-700">Delivery</p>
							<p class="text-sm text-muted-foreground truncate">{orderAcceptanceState.currentOrder.deliveryLocation.address}</p>
						</div>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-3 pt-2">					<Button 
						variant="outline" 
						size="lg"
						disabled={orderAcceptanceState.hasResponded || orderAcceptanceState.isRejecting}
						onclick={() => orderAcceptanceState.rejectOrder()}
						class="border-red-200 hover:border-red-300 hover:bg-red-50 text-red-700"
					>
						{#if orderAcceptanceState.isRejecting}
							<div class="w-4 h-4 mr-2 animate-spin border-2 border-current border-t-transparent rounded-full"></div>
						{:else}
							<X class="w-4 h-4 mr-2" />
						{/if}
						Decline
					</Button>
							<Button 
						size="lg"
						disabled={orderAcceptanceState.hasResponded || orderAcceptanceState.isAccepting}
						onclick={() => orderAcceptanceState.acceptOrder()}
						class={cn(
							"shadow-lg transition-all duration-300",
							orderAcceptanceState.urgencyLevel === 'critical' && "bg-red-600 hover:bg-red-700",
							orderAcceptanceState.urgencyLevel === 'urgent' && "bg-orange-600 hover:bg-orange-700",
							orderAcceptanceState.urgencyLevel === 'normal' && "bg-green-600 hover:bg-green-700"
						)}
					>
						{#if orderAcceptanceState.isAccepting}
							<div class="w-4 h-4 mr-2 animate-spin border-2 border-current border-t-transparent rounded-full"></div>
						{:else}
							<DollarSign class="w-4 h-4 mr-2" />
						{/if}
						Accept ₦{orderAcceptanceState.estimatedEarnings}
					</Button>
				</div>

				<div class="text-xs text-center text-muted-foreground pt-2 border-t">
					Tap Accept to start this delivery • Auto-declines in {orderAcceptanceState.formattedTimeRemaining}s
				</div>
			</CardContent>
		</Card>
	</div>
{/if}
