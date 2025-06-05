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
		console.log('- Connection status:', riderDispatchState.connectionStatus);
		console.log('- Available orders:', riderDispatchState.availableOrders);
		console.log('- Modal visible:', orderAcceptanceState.isVisible);
		console.log('- Current order:', orderAcceptanceState.currentOrder);
		console.log('- Location:', riderDispatchState.currentLocation);
		console.log('- Connection error:', riderDispatchState.connectionError);
	}	function forceReconnect() {
		console.log('🔄 MANUAL: Forcing reconnection...');
		riderDispatchState.manualReconnect();
	}
	
	function clearPendingState() {
		console.log('🧹 MANUAL: Clearing pending order state...');
		riderDispatchState.clearAllPendingOrders();
		if (orderAcceptanceState.isVisible) {
			orderAcceptanceState.hideOrderOffer();
		}
	}// Reactive connection status colors using $derived
	const connectionColor = $derived(
		riderDispatchState.connectionStatus === 'connected' ? 'bg-green-500' :
		riderDispatchState.connectionStatus === 'connecting' ? 'bg-yellow-500' :
		riderDispatchState.connectionStatus === 'failed' ? 'bg-red-500' :
		'bg-gray-500'
	);
		
	// Use $derived for Svelte 5 compatibility
	const hasLocation = $derived(!!riderDispatchState.currentLocation);
</script>

<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
	<!-- Connection Status Indicator -->
	<div class="bg-white/90 backdrop-blur-sm rounded-lg border p-3 text-xs font-mono">
		<div class="flex items-center gap-2 mb-2">
			<div class="w-3 h-3 rounded-full {connectionColor}"></div>
			<span class="font-semibold">{riderDispatchState.connectionStatus}</span>
		</div>		<div class="space-y-1 text-gray-600">
			<div>📍 Location: {hasLocation ? '✅' : '❌'}</div>
			{#if riderDispatchState.currentLocation}
				<div class="text-xs">Lat: {riderDispatchState.currentLocation.lat.toFixed(6)}</div>
				<div class="text-xs">Lng: {riderDispatchState.currentLocation.lng.toFixed(6)}</div>
			{/if}
			<div>🔗 WebSocket: {riderDispatchState.isConnected ? '✅' : '❌'}</div>
			<div>📦 Orders: {riderDispatchState.availableOrders.length}</div>
			<div>🎯 Tracking: {riderDispatchState.isLocationTracking ? '✅' : '❌'}</div>
			<div>⏳ Pending: {riderDispatchState.hasPendingOrder ? '🔒' : '🔓'}</div>
			{#if riderDispatchState.pendingOrderId}
				<div class="text-xs text-orange-600">ID: {riderDispatchState.pendingOrderId.slice(0, 8)}...</div>
			{/if}
			{#if riderDispatchState.connectionError}
				<div class="text-red-600">⚠️ {riderDispatchState.connectionError}</div>
			{/if}
		</div>
	</div>
	<Button onclick={testOrderModal} variant="destructive" size="sm">
		🧪 Test Order Modal
	</Button>
	
	<Button onclick={clearPendingState} variant="secondary" size="sm">
		🧹 Clear Pending
	</Button>
	
	<Button onclick={forceReconnect} variant="outline" size="sm">
		🔄 Force Reconnect
	</Button>
	
	<Button onclick={logCurrentState} variant="outline" size="sm">
		📊 Log State
	</Button>
	
	<div class="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
		WS: {riderDispatchState.isConnected ? '🟢' : '🔴'}
		Modal: {orderAcceptanceState.isVisible ? '👁️' : '❌'}
		Pending: {riderDispatchState.hasPendingOrder ? '🔒' : '🔓'}
	</div>
</div>
