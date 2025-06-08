import { riderOrderService } from '$lib/services/riderOrderService';

export async function load() {
	try {
		const currentDelivery = await riderOrderService.getCurrentDelivery();

		return {
			currentDelivery
		};
	} catch (error) {
		console.error('Error loading current delivery:', error);
		return {
			currentDelivery: null
		};
	}
}
