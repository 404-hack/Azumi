import type { PageLoad } from './$types';
import { client } from '$lib/hc';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {
	try {
		const orderId = params.id;

		const response = await client.rider.dispatch['accept-order'][':orderId'].$get({
			param: { orderId }
		});

		if (!response.ok) {
			const errorData = await response.json();
			error(response.status, errorData.message || 'Failed to load order details');
		}

		const orderDetails = await response.json();

		return {
			order: orderDetails.data,
			orderId
		};
	} catch (err) {
		console.error('Error loading order details:', err);
		error(500, 'Error loading order details');
	}
};
