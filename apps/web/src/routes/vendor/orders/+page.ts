import { authClient } from '$lib/auth-client';
import { client } from '$lib/hc';

export const load = async () => {
	const session = await authClient.getSession();
	const newOrder = await (
		await client.vendor.orders.$get({
			query: {
				status: 'PAYMENT_CONFIRMED'
			}
		})
	).json();
	console.log('🚀 ~ load ~ newOrder:', newOrder);
	return {
		user: session.data?.user,
		newOrder: newOrder.data
	};
};
