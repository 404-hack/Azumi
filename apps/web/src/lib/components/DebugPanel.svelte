<script lang="ts">
	import { orderAcceptanceState } from '$lib/states/orderAcceptanceState.svelte';
	import { riderDispatchState } from '$lib/states/riderDispatchState.svelte';
	import { Button } from '$lib/components/ui/button';
	
	const testOrder = {
		id: 'test-order-123',
		shopId: 'shop-456',
		pickupLocation: {
			lat: 9.0579,
			lng: 7.4951,
			address: '123 Test Restaurant, Abuja'
		},
		deliveryLocation: {
			lat: 9.0765,
			lng: 7.3986,
			address: '456 Customer Address, Abuja'
		},
		orderValue: 2500,
		deliveryFee: 800,
		estimatedDistance: 5.2,
		estimatedDuration: 25,
		itemCount: 3,
		createdAt: new Date().toISOString()
	};
	
	function testOrderModal() {
		console.log('🧪 TEST: Manually triggering order modal');
		orderAcceptanceState.showOrderOffer(testOrder);
	}
	
	function logCurrentState() {
		console.log('📊 CURRENT STATE DEBUG:');
		console.log('- WebSocket connected:', riderDispatchState.isConnected);
		console.log('- Available orders:', riderDispatchState.availableOrders);
		console.log('- Modal visible:', orderAcceptanceState.isVisible);
		console.log('- Current order:', orderAcceptanceState.currentOrder);
		console.log('- Rider ID:', riderDispatchState.riderId);
		console.log('- Location:', riderDispatchState.currentLocation);
	}
</script>

<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
	<Button onclick={testOrderModal} variant="destructive" size="sm">
		🧪 Test Order Modal
	</Button>
	
	<Button onclick={logCurrentState} variant="outline" size="sm">
		📊 Log State
	</Button>
	
	<div class="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
		WS: {riderDispatchState.isConnected ? '🟢' : '🔴'}
		Modal: {orderAcceptanceState.isVisible ? '👁️' : '❌'}
	</div>
</div>
