import { client } from '$lib/hc';

type ApiOrder = {
	id: string;
	code: string | null;
	status:
		| 'PENDING'
		| 'PAYMENT_CONFIRMED'
		| 'CONFIRMED'
		| 'READY'
		| 'RIDER_ASSIGNED'
		| 'IN_TRANSIT'
		| 'DELIVERED'
		| 'COMPLETED'
		| 'CANCELLED';
	total: number;
	deliveryFee: number | null;
	createdAt: string | null;
	riderConfirmationCode?: number | null;
	latitude: number;
	longitude: number;
	specialInstructions?: string | null;
	shop: {
		id: string;
		name: string;
		phoneNumber: string | null;
		address: string | null;
		latitude: number | null;
		longitude: number | null;
	};
	estimatedDistance?: number;
	estimatedDuration?: number;
};

export interface OrderDetails {
	id: string;
	code: string | null;
	status:
		| 'PENDING'
		| 'PAYMENT_CONFIRMED'
		| 'CONFIRMED'
		| 'READY'
		| 'RIDER_ASSIGNED'
		| 'IN_TRANSIT'
		| 'DELIVERED'
		| 'COMPLETED'
		| 'CANCELLED';
	total: number;
	deliveryFee: number | null;
	createdAt: string | null;
	riderConfirmationCode?: number | null;
	latitude: number;
	longitude: number;
	addressName?: string | null;
	specialInstructions?: string | null;
	shop: {
		id: string;
		name: string;
		phoneNumber: string | null;
		address: string | null;
		latitude: number | null;
		longitude: number | null;
	};
	customer?: {
		id: string;
		name: string | null;
		phoneNumber: string | null;
	};
	items?: {
		id: string;
		menuItemId: string | null;
		menuItemName: string;
		quantity: number;
		unitPrice: number;
		totalPrice: number;
		specialInstructions: string | null;
		menuItem?: {
			id: string;
			name: string;
			imageUrl: string | null;
			description: string | null;
		} | null;
		options?: {
			id: string;
			optionId: string | null;
			optionGroupId: string | null;
			optionName: string;
			quantity: number | null;
			price: number;
			option?: {
				id: string;
				name: string;
			} | null;
			optionGroup?: {
				id: string;
				name: string;
			} | null;
		}[];
	}[];
	estimatedDistance?: number;
	estimatedDuration?: number;
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
			return (data.data as OrderDetails) || null;
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
			return (data.data as AcceptedOrder) || null;
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
				json: { confirmationCode: confirmationCode || 0 }
			});

			return response.ok;
		} catch (error) {
			console.error('Error marking order as delivered:', error);
			return false;
		}
	}

	async getAvailableOrders(): Promise<OrderDetails[]> {
		try {
			const response = await client.rider.orders.$get();

			if (!response.ok) {
				console.error('Failed to fetch available orders');
				return [];
			}

			const data = await response.json();
			return (data.data || []) as OrderDetails[];
		} catch (error) {
			console.error('Error fetching available orders:', error);
			return [];
		}
	}

	async getCurrentDelivery(): Promise<OrderDetails | null> {
		try {
			const response = await client.rider.orders.$get();

			if (!response.ok) {
				return null;
			}

			const data = await response.json();
			const currentOrder = data.data?.find(
				(order: ApiOrder) => order.status === 'RIDER_ASSIGNED' || order.status === 'IN_TRANSIT'
			);
			return (currentOrder as OrderDetails) || null;
		} catch (error) {
			console.error('Error fetching current delivery:', error);
			return null;
		}
	}
	async getOrderHistory(limit = 20): Promise<OrderDetails[]> {
		try {
			const response = await client.rider.orders.all.$get();

			if (!response.ok) {
				console.error('Failed to fetch order history');
				return [];
			}

			const data = await response.json();
			return (data.data || []) as OrderDetails[];
		} catch (error) {
			console.error('Error fetching order history:', error);
			return [];
		}
	}
}

export const riderOrderService = new RiderOrderService();
