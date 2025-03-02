export type OrderStatus = 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export type OrderItem = {
	id: string;
	name: string;
	quantity: number;
	price: number;
	options?: {
		name: string;
		price: number;
	}[];
	specialInstructions?: string;
};

export type Order = {
	id: string;
	orderNumber: string;
	customerId: string;
	customerName: string;
	customerPhone: string;
	vendorId: string;
	vendorName: string;
	items: OrderItem[];
	status: OrderStatus;
	total: number;
	subtotal: number;
	deliveryFee: number;
	platformFee: number;
	tax: number;
	createdAt: Date;
	updatedAt: Date;
	estimatedReadyTime?: Date;
	paymentStatus: 'pending' | 'paid' | 'failed';
	paymentMethod: 'cash' | 'card' | 'mobile_money';
	deliveryAddress?: string;
	deliveryInstructions?: string;
	riderId?: string;
	riderName?: string;
	deliveryStatus?: 'pending' | 'assigned' | 'picked_up' | 'delivered' | 'failed';
};
