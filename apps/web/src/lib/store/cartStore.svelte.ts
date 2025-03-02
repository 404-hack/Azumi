interface CartItem {
	id: string;
	name: string;
	price: number;
	quantity: number;
	image?: string;
}

class CartStore {
	items = $state<CartItem[]>([]);
	isOpen = $state(false);

	addItem(item: CartItem) {
		const existingItem = this.items.find((i) => i.id === item.id);
		if (existingItem) {
			existingItem.quantity += 1;
		} else {
			this.items = [...this.items, { ...item, quantity: 1 }];
		}
	}

	removeItem(id: string) {
		this.items = this.items.filter((item) => item.id !== id);
	}

	updateQuantity(id: string, quantity: number) {
		const item = this.items.find((i) => i.id === id);
		if (item) {
			if (quantity <= 0) {
				this.removeItem(id);
			} else {
				item.quantity = quantity;
			}
		}
	}

	getTotal() {
		return this.items.reduce((total, item) => total + item.price * item.quantity, 0);
	}

	clearCart() {
		this.items = [];
	}

	toggleCart() {
		this.isOpen = !this.isOpen;
	}
}

export const cart = new CartStore();
