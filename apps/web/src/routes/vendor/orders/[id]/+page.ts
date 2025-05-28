import type { PageLoad } from './$types';
import { client } from '$lib/hc';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {
	try {
		const orderId = params.id;

		const response = await client.vendor.order[':id'].$get({
			param: { id: orderId }
		});

		if (!response.ok) {
			error(response.status, 'Failed to load order details');
		}

		const order = await response.json();
		console.log('🚀 ~ constload:PageLoad= ~ order:', order);

		return {
			order: order.data
		};
	} catch (err) {
		console.error('Error loading order:', err);
		error(500, 'Error loading order details');
	}
};
