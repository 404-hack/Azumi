import { error } from '@sveltejs/kit';
import { riderOrderService } from '$lib/services/riderOrderService';

export async function load({ params }) {
	const orderId = params.id;
	
	try {
		const order = await riderOrderService.getOrderDetails(orderId);
		
		if (!order) {
			throw error(404, 'Order not found');
		}
		
		return {
			order
		};
	} catch (err) {
		console.error('Error loading order details:', err);
		throw error(500, 'Failed to load order details');
	}
}
