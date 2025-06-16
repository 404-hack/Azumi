import type { PageLoad } from './$types';
import { customerOrderService } from '$lib/services/customerOrderService';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params, fetch }) => {
	try {
		const orderId = params.orderId;

		if (!orderId) {
			throw error(404, 'Order ID is required');
		}

		const order = await customerOrderService.getOrderDetails(orderId);
		console.log('🚀 ~ constload:PageLoad= ~ order:', order);

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
