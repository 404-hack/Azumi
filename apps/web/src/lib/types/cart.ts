export interface CartMenuItem {
	id: string;
	name: string;
	price: number;
	image: string | null;
}

export interface CartItem {
	id: string;
	cartId: string;
	menuItemId: string;
	menuItem: CartMenuItem;
	quantity: number;
	specialInstructions: string;
	totalPrice: number;
	createdAt: string;
	updatedAt: string;
}

export interface Cart {
	id: string;
	customerId: string;
	shopId: string;
	items: CartItem[];
	shop: {
		id: string;
		name: string;
		slug: string;
		logo: string | null;
		coverImage: string | null;
	};
	status: string;
	subtotal: number;
	totalItems: number;
	createdAt: string;
	updatedAt: string;
}
