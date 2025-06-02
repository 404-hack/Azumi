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
		this.startConnectionHealthCheck();
		this.startOrderUpdateInterval();

		if (this.riderId) {
			this.ensureConnection();
		}
	}
	cleanup() {
		console.log('🧹 RiderDispatchState: Cleaning up with health monitoring');
		this.disconnectWebSocket();
		this.stopLocationTracking();
		this.stopConnectionHealthCheck();
		this.stopOrderUpdateInterval();
		this.clearAllOrderTimers();
	}
	private async connectWebSocket() {
		console.log('🔌 RiderDispatchState: Attempting WebSocket connection:', {
			browser,
			hasLocation: !!this.currentLocation,
			hasRiderId: !!this.riderId,
			currentStatus: this.connectionStatus,
			hasExistingWs: !!this.ws
		});

		if (!browser || !this.currentLocation || !this.riderId) {
			console.log('❌ RiderDispatchState: Missing requirements for connection');
			this.connectionStatus = 'failed';
			return;
		}

		// Prevent multiple simultaneous connection attempts
		if (this.connectionStatus === 'connecting' || this.ws?.readyState === WebSocket.CONNECTING) {
			console.log('⏳ RiderDispatchState: Connection already in progress, skipping...');
			return;
		}

		// Close existing connection if any
		if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
			console.log('🔄 RiderDispatchState: Closing existing connection before reconnecting');
			this.ws.close();
			this.ws = null;
		}

		this.connectionStatus = 'connecting';

		try {
			// Use the API base URL instead of window.location
			const apiUrl = new URL(PUBLIC_API_BASE_URL);
			const protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
			const wsUrl = `${protocol}//${apiUrl.host}/api/rider/ws?riderId=${this.riderId}&lat=${this.currentLocation.lat}&lng=${this.currentLocation.lng}`;

			console.log('🔌 Connecting to dispatch system:', wsUrl);

			this.ws = new WebSocket(wsUrl);
			this.ws.onopen = () => {
				console.log('✅ Connected to dispatch system');
				this.isConnected = true;
				this.connectionStatus = 'connected';
				this.connectionError = null;
				this.reconnectAttempts = 0;
				this.missedHeartbeats = 0;
				this.lastMessageReceived = Date.now();
				this.startHeartbeat();

				// Handle pending availability update
				if (this.pendingAvailabilityUpdate !== null) {
					console.log('Processing pending availability update:', this.pendingAvailabilityUpdate);
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
				console.log('🔌 Disconnected from dispatch system');
				this.isConnected = false;
				this.connectionStatus = 'disconnected';
				this.stopHeartbeat();
				this.scheduleReconnect();
			};

			this.ws.onerror = (error) => {
				console.error('❌ WebSocket error:', error);
				this.connectionError = 'Connection error occurred';
				this.connectionStatus = 'failed';
			};
		} catch (error) {
			console.error('❌ Failed to connect to dispatch system:', error);
			this.connectionError = 'Failed to connect';
			this.connectionStatus = 'failed';
			this.scheduleReconnect();
		}
	}

	private scheduleReconnect() {
		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			this.connectionError = 'Max reconnection attempts reached';
			return;
		}

		const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
		console.log(
			`⏰ Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`
		);

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
				this.availableOrders = this.availableOrders.filter((order) => order.id !== message.orderId);
				this.clearOrderTimer(message.orderId);
				this.clearPendingOrder(message.orderId);
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
		try {
			const response = await fetch(`/api/rider/dispatch/accept-order/${orderId}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});

			if (response.ok) {
				this.availableOrders = this.availableOrders.filter((order) => order.id !== orderId);
				this.clearOrderTimer(orderId);
				this.clearPendingOrder(orderId);
				console.log('✅ Order accepted:', orderId);
			} else {
				throw new Error('Failed to accept order');
			}
		} catch (error) {
			console.error('Failed to accept order:', error);
			throw error;
		}
	}

	rejectOrder(orderId: string) {
		this.availableOrders = this.availableOrders.filter((order) => order.id !== orderId);
		this.clearOrderTimer(orderId);
		this.clearPendingOrder(orderId);
		console.log('❌ Order rejected:', orderId);
	}

	private clearPendingOrder(orderId: string) {
		if (this.pendingOrderId === orderId) {
			this.hasPendingOrder = false;
			this.pendingOrderId = null;
			console.log('🔓 RiderDispatchState: Cleared pending order state for:', orderId);
		}
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

				const isFirstLocation = !this.currentLocation;
				this.currentLocation = newLocation;
				this.lastLocationUpdate = Date.now();
				this.updateLocationOnServer(newLocation);

				// Auto-connect when location becomes available for the first time
				if (isFirstLocation && this.riderId) {
					console.log('📍 RiderDispatchState: First location acquired, ensuring connection...');
					this.ensureConnection();
				}
				// Or reconnect if we were disconnected
				else if (
					!this.isConnected &&
					this.riderId &&
					this.connectionStatus !== 'connecting' &&
					this.reconnectAttempts < this.maxReconnectAttempts
				) {
					console.log('📍 RiderDispatchState: Location updated, attempting reconnection...');
					this.ensureConnection();
				}
			},
			(error) => {
				console.error('Location tracking error:', error);
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
		console.log('Setting rider ID:', riderId);
		this.riderId = riderId;
		if (this.currentLocation && !this.isConnected) {
			console.log('Attempting WebSocket connection with rider ID and location');
			this.connectWebSocket();
		} else {
			console.log('Cannot connect WebSocket:', {
				hasLocation: !!this.currentLocation,
				isConnected: this.isConnected,
				riderId: this.riderId
			});
		}
	}

	// Enhanced connection management with health monitoring
	private ensureConnection() {
		console.log('🔄 RiderDispatchState: Ensuring connection...', {
			hasLocation: !!this.currentLocation,
			hasRiderId: !!this.riderId,
			currentStatus: this.connectionStatus,
			isConnected: this.isConnected
		});

		if (!this.currentLocation) {
			console.log('⏳ RiderDispatchState: Waiting for location before connecting...');
			// Will retry when location is available
			return;
		}

		if (this.connectionStatus === 'connected') {
			console.log('✅ RiderDispatchState: Already connected');
			return;
		}

		if (this.connectionStatus === 'connecting') {
			console.log('⏳ RiderDispatchState: Connection already in progress');
			return;
		}

		this.connectWebSocket();
	}

	private startConnectionHealthCheck() {
		this.connectionHealthCheck = setInterval(() => {
			this.checkConnectionHealth();
		}, 10000); // Check every 10 seconds
	}

	private stopConnectionHealthCheck() {
		if (this.connectionHealthCheck) {
			clearInterval(this.connectionHealthCheck);
			this.connectionHealthCheck = null;
		}
	}

	private checkConnectionHealth() {
		const now = Date.now();
		const timeSinceLastMessage = now - this.lastMessageReceived;

		console.log('🔍 RiderDispatchState: Health check', {
			connectionStatus: this.connectionStatus,
			isConnected: this.isConnected,
			timeSinceLastMessage,
			missedHeartbeats: this.missedHeartbeats,
			hasLocation: !!this.currentLocation,
			hasRiderId: !!this.riderId
		});

		// If we should be connected but haven't received messages
		if (this.connectionStatus === 'connected' && timeSinceLastMessage > 60000) {
			console.log('⚠️ RiderDispatchState: Connection appears stale, reconnecting...');
			this.missedHeartbeats++;

			if (this.missedHeartbeats >= this.maxMissedHeartbeats) {
				console.log('❌ RiderDispatchState: Too many missed heartbeats, forcing reconnection');
				this.forceReconnect();
			}
		}

		// Auto-connect if we have location and rider ID but not connected
		if (this.currentLocation && this.riderId && this.connectionStatus === 'disconnected') {
			console.log('🔄 RiderDispatchState: Auto-reconnecting (has location and rider ID)');
			this.ensureConnection();
		}
	}
	private forceReconnect() {
		console.log('🔄 RiderDispatchState: Force reconnecting...');
		this.disconnectWebSocket();
		this.reconnectAttempts = 0; // Reset attempts for fresh start
		this.missedHeartbeats = 0;
		setTimeout(() => {
			this.ensureConnection();
		}, 1000);
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

		this.availableOrders = this.availableOrders.filter((order) => order.id !== orderId);
		this.clearOrderTimer(orderId);

		if (orderAcceptanceState.currentOrder?.id === orderId) {
			orderAcceptanceState.hideOrderOffer();
		}
	}

	// Public methods for external access
	public getConnectionStatus() {
		return this.connectionStatus;
	}

	public manualReconnect() {
		this.forceReconnect();
	}
}

export const riderDispatchState = new RiderDispatchState();
