import type { PageLoad } from './$types';
import { riderOrderService } from '$lib/services/riderOrderService';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {
	try {
		const orderId = params.id;
		if (!orderId) {
			throw error(404, 'Order ID is required');
		}

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
};
