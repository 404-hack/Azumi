import type { z } from 'zod';
import { orderSchema } from './schema';

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
	customerName: string;
	customerPhone: string;
	items: OrderItem[];
	status: OrderStatus;
	total: number;
	createdAt: Date;
	updatedAt: Date;
	estimatedReadyTime?: Date;
	paymentStatus: 'pending' | 'paid' | 'failed';
	paymentMethod: 'cash' | 'card' | 'mobile_money';
	deliveryAddress?: string;
	deliveryInstructions?: string;
};

export type OrderSchema = typeof orderSchema;
