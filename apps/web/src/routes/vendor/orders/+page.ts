import { authClient } from '$lib/auth-client';
import { client } from '$lib/hc';

export const load = async ({ url }) => {
	const status = url.searchParams.get('status') || 'new';

	let apiStatus: string;
	switch (status) {
		case 'new':
			apiStatus = 'PAYMENT_CONFIRMED';
			break;
		case 'confirmed':
			apiStatus = 'CONFIRMED';
			break;
		case 'ready':
			apiStatus = 'READY';
			break;
		case 'completed':
			apiStatus = 'COMPLETED';
			break;
		case 'cancelled':
			apiStatus = 'CANCELLED';
			break;
		default:
			apiStatus = 'PAYMENT_CONFIRMED';
	}

	const orders = await (
		await client.vendor.orders.$get({
			query: {
				status: apiStatus
			}
		})
	).json();
	console.log('🚀 ~ load ~ orders:', orders);

	return {
		orders: orders.data,
		currentStatus: status
	};
};
