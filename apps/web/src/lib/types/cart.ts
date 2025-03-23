import type { MenuItem } from './menu';

export interface CartOption {
	id: string;
	cartItemId: string;
	optionId: string;
	optionGroupId: string;
	quantity: number;
	price: number;
	option?: {
		id: string;
		name: string;
		price: number;
	};
}

export interface CartItem {
	id: string;
	cartId: string;
	menuItemId: string;
	quantity: number;
	specialInstructions?: string | null;
	totalPrice: number;
	options?: CartOption[];
	menuItem?: MenuItem;
	createdAt: string;
	updatedAt: string;
}

export interface Restaurant {
	id: string;
	name: string;
	logo?: string | null;
}

export interface Cart {
	id: string;
	customerId: string;
	restaurantId: string;
	status: 'active' | 'abandoned' | 'converted';
	items?: CartItem[];
	restaurant?: Restaurant;
	totalItems?: number;
	subtotal?: number;
	createdAt: string;
	updatedAt: string;
}

export interface CartAddItemRequest {
	menuItemId: string;
	quantity: number;
	specialInstructions?: string;
	options?: {
		optionId: string;
		optionGroupId: string;
		quantity: number;
	}[];
}

export interface CartUpdateItemRequest {
	quantity: number;
}
