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
	private ws: WebSocket | null = null;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectDelay = 1000;
	private locationWatchId: number | null = null;	private heartbeatInterval: NodeJS.Timeout | null = null;
	private riderId: string | null = null;
	private pendingAvailabilityUpdate: boolean | null = null;
	private heartbeatCount = 0; // Track heartbeat messages to reduce logging

	initialize(riderId?: string) {
		if (!browser) return;

		if (riderId) {
			this.riderId = riderId;
		}

		this.startLocationTracking();

		if (this.riderId) {
			this.connectWebSocket();
		}
	}

	cleanup() {
		this.disconnectWebSocket();
		this.stopLocationTracking();
	}
	private async connectWebSocket() {
		console.log('Attempting WebSocket connection:', {
			browser,
			hasLocation: !!this.currentLocation,
			hasRiderId: !!this.riderId
		});

		if (!browser || !this.currentLocation || !this.riderId) return;

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
				this.connectionError = null;
				this.reconnectAttempts = 0;
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
				this.stopHeartbeat();
				this.scheduleReconnect();
			};

			this.ws.onerror = (error) => {
				console.error('WebSocket error:', error);
				this.connectionError = 'Connection error occurred';
			};
		} catch (error) {
			console.error('Failed to connect to dispatch system:', error);
			this.connectionError = 'Failed to connect';
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
					this.availableOrders = message.availableOrders;
				}
				break;
			case 'new_order':
				console.log('🔔 New order received:', message.order);
				this.availableOrders = [...this.availableOrders, message.order];
				orderAcceptanceState.showOrderOffer(message.order);
				break;

			case 'order_expired':
				console.log('⏰ Order expired:', message.orderId);
				this.availableOrders = this.availableOrders.filter((order) => order.id !== message.orderId);
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
		console.log('❌ Order rejected:', orderId);
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
				this.currentLocation = newLocation;
				this.lastLocationUpdate = Date.now();
				this.updateLocationOnServer(newLocation);

				if (
					!this.isConnected &&
					this.riderId &&
					this.reconnectAttempts < this.maxReconnectAttempts
				) {
					this.connectWebSocket();
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
}

export const riderDispatchState = new RiderDispatchState();
