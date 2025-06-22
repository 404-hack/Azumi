import { client } from '$lib/hc';

export class CustomerOrderService {
	async getOrderHistory() {
		try {
			const response = await client.order.$get();

			if (!response.ok) {
				console.error('Failed to fetch order history');
				return [];
			}

			const data = await response.json();
			return data.data;
		} catch (error) {
			console.error('Error fetching order history:', error);
			return [];
		}
	}
	private calculateEstimatedDeliveryTime(createdAt: string, status: string): string {
		const orderTime = new Date(createdAt);
		const now = new Date();

		// Only show estimated delivery for pending/active orders
		if (['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(status)) {
			return '';
		}

		// Calculate realistic delivery time based on order time + typical preparation/delivery duration
		let estimatedMinutes = 0;

		switch (status) {
			case 'PENDING': {
				// Order just placed - estimate 30-40 minutes from order time
				estimatedMinutes = 35;
				break;
			}
			case 'PAYMENT_CONFIRMED':
			case 'CONFIRMED': {
				// Payment confirmed/order accepted - estimate 25-30 minutes from order time
				estimatedMinutes = 27;
				break;
			}
			case 'READY': {
				// Food is ready, waiting for rider - estimate 15-20 minutes from order time
				estimatedMinutes = 17;
				break;
			}
			case 'RIDER_ASSIGNED':
			case 'IN_TRANSIT': {
				// Rider is on the way - estimate 10-15 minutes from order time
				estimatedMinutes = 12;
				break;
			}
			default:
				return '';
		}

		// Calculate estimated delivery time from order time
		const estimatedDeliveryTime = new Date(orderTime.getTime() + estimatedMinutes * 60 * 1000);

		// If estimated time is in the past, show "Any moment now"
		if (estimatedDeliveryTime <= now) {
			return 'Any moment now';
		}

		return estimatedDeliveryTime.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true
		});
	}

	private getFoodImageUrl(itemName: string): string {
		// Return food-relevant images based on item name
		const foodKeywords = {
			pizza: '/hero-1.jpeg',
			burger: '/hero-2.jpeg',
			chicken: '/shop.avif',
			rice: '/hero-1.jpeg',
			pasta: '/hero-2.jpeg',
			salad: '/shop.avif',
			sandwich: '/hero-1.jpeg',
			soup: '/hero-2.jpeg',
			fish: '/shop.avif',
			beef: '/hero-1.jpeg',
			vegetable: '/hero-2.jpeg',
			fruit: '/shop.avif'
		};

		const lowerItemName = itemName.toLowerCase();
		for (const [keyword, image] of Object.entries(foodKeywords)) {
			if (lowerItemName.includes(keyword)) {
				return image;
			}
		}

		// Default food image
		return '/shop.avif';
	}
	async getOrderDetails(orderId: string) {
		try {
			const response = await client.order[':id'].$get({
				param: { id: orderId }
			});

			if (!response.ok) {
				console.error('Failed to fetch order details');
				return null;
			}

			const result = await response.json();
			return result.data;
		} catch (error) {
			console.error('Error fetching order details:', error);
			return null;
		}
	}
}

export const customerOrderService = new CustomerOrderService();
