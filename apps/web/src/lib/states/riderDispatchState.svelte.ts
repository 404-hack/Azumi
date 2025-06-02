import { browser } from '$app/environment';
import { page } from '$app/stores';
import { get } from 'svelte/store';
import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { orderAcceptanceState } from './orderAcceptanceState.svelte';

interface AvailableOrder {
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
	timeLeftSeconds?: number;
	startTime?: number;
}

interface WebSocketMessage {
	type: string;
	[key: string]: any;
}

class RiderDispatchState {
	isConnected = $state(false);
	availableOrders = $state<AvailableOrder[]>([]);
	currentLocation = $state<{ lat: number; lng: number } | null>(null);
	isLocationTracking = $state(false);
	connectionError = $state<string | null>(null);
	lastLocationUpdate = $state<number | null>(null);
	connectionStatus = $state<'connecting' | 'connected' | 'disconnected' | 'failed'>('disconnected');
	hasPendingOrder = $state(false);
	pendingOrderId = $state<string | null>(null);
	private ws: WebSocket | null = null;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectDelay = 1000;
	private locationWatchId: number | null = null;
	private heartbeatInterval: NodeJS.Timeout | null = null;
	private riderId: string | null = null;
	private pendingAvailabilityUpdate: boolean | null = null;
	private heartbeatCount = 0;
	private connectionHealthCheck: NodeJS.Timeout | null = null;
	private lastMessageReceived = 0;
	private missedHeartbeats = 0;
	private maxMissedHeartbeats = 3;
	private orderTimers = new Map<string, NodeJS.Timeout>();
	private orderUpdateInterval: NodeJS.Timeout | null = null;
	private readonly ORDER_TIMEOUT_SECONDS = 30;
	initialize(riderId?: string) {
		if (!browser) return;

		if (riderId) {
			this.riderId = riderId;
		}

		console.log('🚀 RiderDispatchState: Initializing with enhanced connection monitoring');
		this.startLocationTracking();
		this.startOrderUpdateInterval();
		if (this.riderId) {
			this.connectIfReady();
		}
	}
	cleanup() {
		console.log('🧹 RiderDispatchState: Cleaning up with health monitoring');

		// Clear pending order state
		this.hasPendingOrder = false;
		this.pendingOrderId = null;
		console.log('🔓 RiderDispatchState: Cleared all pending order state');

		// Clear timers
		this.clearAllOrderTimers();

		// Stop intervals
		this.stopOrderUpdateInterval();

		// Stop location tracking
		this.stopLocationTracking();

		// Close WebSocket
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}

		// Clear heartbeat
		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
			this.heartbeatInterval = null;
		}

		this.isConnected = false;
		this.connectionStatus = 'disconnected';
	}
	private async connectWebSocket() {
		if (!browser || !this.currentLocation || !this.riderId || this.isConnected) {
			return;
		}

		// Close existing connection
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}

		this.connectionStatus = 'connecting';

		try {
			const apiUrl = new URL(PUBLIC_API_BASE_URL);
			const protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
			const wsUrl = `${protocol}//${apiUrl.host}/api/rider/ws?riderId=${this.riderId}&lat=${this.currentLocation.lat}&lng=${this.currentLocation.lng}`;

			this.ws = new WebSocket(wsUrl);
			this.ws.onopen = () => {
				this.isConnected = true;
				this.connectionStatus = 'connected';
				this.connectionError = null;
				this.reconnectAttempts = 0;
				this.missedHeartbeats = 0;
				this.lastMessageReceived = Date.now();
				this.startHeartbeat();

				if (this.pendingAvailabilityUpdate !== null) {
					this.updateAvailabilityStatus(this.pendingAvailabilityUpdate);
					this.pendingAvailabilityUpdate = null;
				}
			};

			this.ws.onmessage = (event) => {
				try {
					const message: WebSocketMessage = JSON.parse(event.data);
					this.handleWebSocketMessage(message);
				} catch (error) {
					console.error('Failed to parse WebSocket message:', error);
				}
			};
			this.ws.onclose = () => {
				this.isConnected = false;
				this.connectionStatus = 'disconnected';
				this.stopHeartbeat();
				this.scheduleReconnect();
			};
			this.ws.onerror = (error) => {
				this.connectionError = 'Connection error occurred';
				this.connectionStatus = 'failed';
			};
		} catch (error) {
			this.connectionError = 'Failed to connect';
			this.connectionStatus = 'failed';
			this.scheduleReconnect();
		}
	}
	private scheduleReconnect() {
		if (this.reconnectAttempts >= 3) {
			this.connectionError = 'Max reconnection attempts reached';
			return;
		}

		const delay = 5000; // Fixed 5 second delay

		setTimeout(() => {
			this.reconnectAttempts++;
			this.connectWebSocket();
		}, delay);
	}
	private disconnectWebSocket() {
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
		this.stopHeartbeat();
		this.isConnected = false;
		this.connectionStatus = 'disconnected';
	}

	private startHeartbeat() {
		this.heartbeatInterval = setInterval(() => {
			if (this.ws && this.ws.readyState === WebSocket.OPEN) {
				this.ws.send(JSON.stringify({ type: 'heartbeat' }));
			}
		}, 30000);
	}

	private stopHeartbeat() {
		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
			this.heartbeatInterval = null;
		}
	}
	private handleWebSocketMessage(message: WebSocketMessage) {
		this.lastMessageReceived = Date.now();
		this.missedHeartbeats = 0; // Reset on any message

		// Only log heartbeat_ack messages every 10th time to reduce spam
		if (message.type === 'heartbeat_ack') {
			this.heartbeatCount++;
			if (this.heartbeatCount % 10 === 0) {
				console.log(`💓 RiderDispatchState: Heartbeat ${this.heartbeatCount} (connection alive)`);
			}
		} else {
			// Log all non-heartbeat messages normally
			console.log('📨 RiderDispatchState: WebSocket message received:', message);
		}

		switch (message.type) {
			case 'connection_established':
				console.log('✅ Connection established:', message);
				if (message.availableOrders) {
					const ordersWithTimers = message.availableOrders.map((order: AvailableOrder) => ({
						...order,
						startTime: Date.now(),
						timeLeftSeconds: this.ORDER_TIMEOUT_SECONDS
					}));
					this.availableOrders = ordersWithTimers;

					ordersWithTimers.forEach((order: AvailableOrder) => {
						this.startOrderTimer(order.id);
					});
				}
				break;
			case 'new_order':
				console.log('🔔 New order received:', message.order);

				if (this.hasPendingOrder) {
					console.log('⚠️ RiderDispatchState: Ignoring new order - rider has pending decision', {
						pendingOrderId: this.pendingOrderId,
						newOrderId: message.order.id
					});
					return;
				}

				console.log('🔍 Order acceptance state before:', {
					isVisible: orderAcceptanceState.isVisible,
					hasCurrentOrder: !!orderAcceptanceState.currentOrder,
					currentOrderId: orderAcceptanceState.currentOrder?.id
				});

				const newOrder = {
					...message.order,
					startTime: Date.now(),
					timeLeftSeconds: this.ORDER_TIMEOUT_SECONDS
				};

				this.hasPendingOrder = true;
				this.pendingOrderId = newOrder.id;
				this.availableOrders = [...this.availableOrders, newOrder];
				this.startOrderTimer(newOrder.id);
				orderAcceptanceState.showOrderOffer(newOrder);

				console.log('🔍 Order acceptance state after:', {
					isVisible: orderAcceptanceState.isVisible,
					hasCurrentOrder: !!orderAcceptanceState.currentOrder,
					currentOrderId: orderAcceptanceState.currentOrder?.id,
					hasPendingOrder: this.hasPendingOrder,
					pendingOrderId: this.pendingOrderId
				});
				break;
			case 'order_expired':
				console.log('⏰ Order expired:', message.orderId);
				this.clearPendingOrder(message.orderId);
				this.availableOrders = this.availableOrders.filter((order) => order.id !== message.orderId);
				this.clearOrderTimer(message.orderId);

				// Hide modal if it's showing this order
				if (orderAcceptanceState.currentOrder?.id === message.orderId) {
					orderAcceptanceState.hideOrderOffer();
				}
				break;

			case 'heartbeat_ack':
				break;

			default:
				console.log('❓ RiderDispatchState: Unknown message type:', message.type);
		}
	}
	private showOrderNotification(order: AvailableOrder) {
		// Don't create manual notifications - Firebase messaging handles all notifications
		// Just highlight the order in the UI if window is focused
		if (document.hasFocus()) {
			this.highlightOrderCard(order.id);
		}
	}

	// Public method to highlight an order card (can be called from toast notifications)
	highlightOrder(orderId: string) {
		this.highlightOrderCard(orderId);
	}

	private highlightOrderCard(orderId: string) {
		// Find and scroll to the order card or highlight it
		const orderCard = document.querySelector(`[data-order-id="${orderId}"]`);
		if (orderCard) {
			orderCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
			// Add a highlight effect
			orderCard.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
			setTimeout(() => {
				orderCard.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
			}, 3000);
		}
	}
	async acceptOrder(orderId: string) {
		console.log(`✅ RiderDispatchState: Accepting order ${orderId}`);

		// Clear pending state immediately
		this.hasPendingOrder = false;
		this.pendingOrderId = null;

		// Remove from available orders
		this.availableOrders = this.availableOrders.filter((order) => order.id !== orderId);
		this.clearOrderTimer(orderId);

		// Send acceptance to server via WebSocket
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			this.ws.send(
				JSON.stringify({
					type: 'accept_order',
					data: { orderId }
				})
			);
		}
	}

	async rejectOrder(orderId: string) {
		console.log(`❌ RiderDispatchState: Rejecting order ${orderId}`);

		// Clear pending state immediately
		this.hasPendingOrder = false;
		this.pendingOrderId = null;

		// Remove from available orders
		this.availableOrders = this.availableOrders.filter((order) => order.id !== orderId);
		this.clearOrderTimer(orderId);

		// Send rejection to server via WebSocket
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			this.ws.send(
				JSON.stringify({
					type: 'reject_order',
					data: { orderId }
				})
			);
		}
	}
	private clearPendingOrder(orderId: string) {
		console.log(
			`🔍 RiderDispatchState: Checking to clear pending order - orderId: ${orderId}, current pending: ${this.pendingOrderId}`
		);

		if (this.pendingOrderId === orderId) {
			this.hasPendingOrder = false;
			this.pendingOrderId = null;
			console.log('🔓 RiderDispatchState: Cleared pending order state for:', orderId);
		} else {
			console.log('ℹ️ RiderDispatchState: Order not pending, no state to clear');
		}
	}

	// Public method to manually clear pending state (for error recovery)
	public clearAllPendingOrders() {
		console.log('🔄 RiderDispatchState: Manually clearing all pending order state');
		this.hasPendingOrder = false;
		this.pendingOrderId = null;
	}

	private startLocationTracking() {
		if (!browser || !navigator.geolocation) {
			console.error('Geolocation not supported');
			return;
		}

		this.isLocationTracking = true;
		this.locationWatchId = navigator.geolocation.watchPosition(
			(position) => {
				const newLocation = {
					lat: position.coords.latitude,
					lng: position.coords.longitude
				};

				console.log('📍 Location update received:', newLocation);

				const isFirstLocation = !this.currentLocation;
				this.currentLocation = newLocation;
				this.lastLocationUpdate = Date.now();
				this.updateLocationOnServer(newLocation);

				console.log('📍 Location set in state:', this.currentLocation);

				if (isFirstLocation && this.riderId) {
					this.connectIfReady();
				} else if (
					!this.isConnected &&
					this.riderId &&
					this.connectionStatus !== 'connecting' &&
					this.reconnectAttempts < 3
				) {
					this.connectIfReady();
				}
			},
			(error) => {
				console.error('📍 Location tracking error:', error);
				this.isLocationTracking = false;
			},
			{
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 30000
			}
		);
		navigator.permissions?.query({ name: 'notifications' }).then((result) => {
			if (result.state === 'prompt') {
				Notification.requestPermission();
			}
		});
	}

	private stopLocationTracking() {
		if (this.locationWatchId !== null) {
			navigator.geolocation.clearWatch(this.locationWatchId);
			this.locationWatchId = null;
		}
		this.isLocationTracking = false;
	}

	private async updateLocationOnServer(location: { lat: number; lng: number }) {
		if (!this.isConnected || !this.ws) return;

		try {
			this.ws.send(
				JSON.stringify({
					type: 'location_update',
					data: {
						lat: location.lat,
						lng: location.lng
					}
				})
			);
		} catch (error) {
			console.error('Failed to update location:', error);
		}
	}
	async updateAvailabilityStatus(isAvailable: boolean) {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
			console.log('WebSocket not ready, queuing availability update:', isAvailable);
			this.pendingAvailabilityUpdate = isAvailable;
			return;
		}

		try {
			this.ws.send(
				JSON.stringify({
					type: 'rider_status_update',
					data: {
						isAvailable
					}
				})
			);
			const response = await fetch(`${PUBLIC_API_BASE_URL}/api/rider/dispatch/update-status`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ isAvailable }),
				credentials: 'include'
			});

			if (!response.ok) {
				throw new Error('Failed to update status on server');
			}
		} catch (error) {
			console.error('Failed to update availability status:', error);
		}
	}

	goOnline() {
		if (this.currentLocation) {
			this.connectWebSocket();
			this.updateAvailabilityStatus(true);
		}
	}

	goOffline() {
		this.updateAvailabilityStatus(false);
		this.disconnectWebSocket();
		this.availableOrders = [];
	}
	setRiderId(riderId: string) {
		this.riderId = riderId;
		this.connectIfReady();
	}

	private connectIfReady() {
		if (!this.riderId || !this.currentLocation || this.isConnected) {
			return;
		}
		this.connectWebSocket();
	}

	// Timer management methods for individual order countdown timers
	private startOrderUpdateInterval() {
		if (this.orderUpdateInterval) {
			clearInterval(this.orderUpdateInterval);
		}

		this.orderUpdateInterval = setInterval(() => {
			this.updateOrderTimers();
		}, 1000);
	}

	private stopOrderUpdateInterval() {
		if (this.orderUpdateInterval) {
			clearInterval(this.orderUpdateInterval);
			this.orderUpdateInterval = null;
		}
	}

	private startOrderTimer(orderId: string) {
		console.log(`⏱️ Starting 30-second timer for order: ${orderId}`);

		const timer = setTimeout(() => {
			this.expireOrder(orderId);
		}, this.ORDER_TIMEOUT_SECONDS * 1000);

		this.orderTimers.set(orderId, timer);
	}

	private clearOrderTimer(orderId: string) {
		const timer = this.orderTimers.get(orderId);
		if (timer) {
			clearTimeout(timer);
			this.orderTimers.delete(orderId);
		}
	}

	private clearAllOrderTimers() {
		this.orderTimers.forEach((timer) => clearTimeout(timer));
		this.orderTimers.clear();
	}

	private updateOrderTimers() {
		const now = Date.now();

		this.availableOrders = this.availableOrders.map((order) => {
			if (order.startTime) {
				const elapsed = Math.floor((now - order.startTime) / 1000);
				const timeLeft = Math.max(0, this.ORDER_TIMEOUT_SECONDS - elapsed);

				return {
					...order,
					timeLeftSeconds: timeLeft
				};
			}
			return order;
		});
	}
	private expireOrder(orderId: string) {
		console.log(`⏰ Order ${orderId} expired after 30 seconds`);

		// Clear pending state if this is the pending order
		this.clearPendingOrder(orderId);

		// Remove from available orders
		this.availableOrders = this.availableOrders.filter((order) => order.id !== orderId);
		this.clearOrderTimer(orderId);

		// Hide modal if it's showing this order
		if (orderAcceptanceState.currentOrder?.id === orderId) {
			orderAcceptanceState.hideOrderOffer();
		}

		console.log(`✅ Order ${orderId} fully expired and cleaned up`);
	}

	// Public methods for external access
	public getConnectionStatus() {
		return this.connectionStatus;
	}
	public manualReconnect() {
		this.disconnectWebSocket();
		this.reconnectAttempts = 0;
		this.connectIfReady();
	}
}

export const riderDispatchState = new RiderDispatchState();
