import { client } from '$lib/hc';
import type { Delivery } from '$lib/types/rider';

export interface OrderDetails {
	id: string;
	orderNumber: string;
	status: 'READY' | 'RIDER_ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED';
	total: number;
	deliveryFee: number;
	createdAt: string;
	riderConfirmationCode?: number;
	pickupLocation: {
		address: string;
		latitude: number;
		longitude: number;
	};
	deliveryLocation: {
		address: string;
		latitude: number;
		longitude: number;
	};
	shop: {
		id: string;
		name: string;
		phone: string;
		address: string;
	};
	customer: {
		name: string;
		phone: string;
	};
	items: Array<{
		id: string;
		name: string;
		quantity: number;
		price: number;
		specialInstructions?: string;
	}>;
	estimatedDistance: number;
	estimatedDuration: number;
	specialInstructions?: string;
}

export interface AcceptedOrder {
	id: string;
	status: string;
	estimatedPickupTime?: string;
	riderId: string;
}

export class RiderOrderService {
	async getOrderDetails(orderId: string): Promise<OrderDetails | null> {
		try {
			const response = await client.rider.orders[':id'].$get({
				param: { id: orderId }
			});

			if (!response.ok) {
				console.error('Failed to fetch order details');
				return null;
			}

			const data = await response.json();
			return data as OrderDetails;
		} catch (error) {
			console.error('Error fetching order details:', error);
			return null;
		}
	}

	async acceptOrder(orderId: string): Promise<AcceptedOrder | null> {
		try {
			const response = await client.rider.orders[':id'].accept.$post({
				param: { id: orderId }
			});

			if (!response.ok) {
				console.error('Failed to accept order');
				return null;
			}

			const data = await response.json();
			return data.data as AcceptedOrder;
		} catch (error) {
			console.error('Error accepting order:', error);
			return null;
		}
	}

	async markOrderPickedUp(orderId: string): Promise<boolean> {
		try {
			const response = await client.rider.orders[':id'].pickup.$post({
				param: { id: orderId }
			});

			return response.ok;
		} catch (error) {
			console.error('Error marking order as picked up:', error);
			return false;
		}
	}
	async markOrderDelivered(orderId: string, confirmationCode?: number): Promise<boolean> {
		try {
			const response = await client.rider.orders[':id'].deliver.$post({
				param: { id: orderId },
				json: { confirmationCode }
			});

			return response.ok;
		} catch (error) {
			console.error('Error marking order as delivered:', error);
			return false;
		}
	}

	async getAvailableOrders(): Promise<OrderDetails[]> {
		try {
			const response = await client.rider.dispatch.orders.$get();

			if (!response.ok) {
				console.error('Failed to fetch available orders');
				return [];
			}

			const data = await response.json();
			return data.orders || [];
		} catch (error) {
			console.error('Error fetching available orders:', error);
			return [];
		}
	}

	async getCurrentDelivery(): Promise<OrderDetails | null> {
		try {
			const response = await client.rider.orders.current.$get();

			if (!response.ok) {
				return null;
			}

			const data = await response.json();
			return data as OrderDetails;
		} catch (error) {
			console.error('Error fetching current delivery:', error);
			return null;
		}
	}

	async getOrderHistory(limit = 20): Promise<OrderDetails[]> {
		try {
			const response = await client.rider.orders.history.$get({
				query: { limit: limit.toString() }
			});

			if (!response.ok) {
				console.error('Failed to fetch order history');
				return [];
			}

			const data = await response.json();
			return data.orders || [];
		} catch (error) {
			console.error('Error fetching order history:', error);
			return [];
		}
	}
}

export const riderOrderService = new RiderOrderService();
