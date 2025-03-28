import { client } from '$lib/hc.js';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const { shopId } = params;

	// Run both requests in parallel
	const [cartResponse, addressResponse] = await Promise.all([
		client.cart.shop[':shopId'].$get({
			param: {
				shopId: shopId
			}
		}),
		client.address.default.$get() // Assuming this endpoint exists for default address
	]);

	// Check responses
	if (!cartResponse.ok) {
		error(400, `Failed to load cart: ${cartResponse.statusText}`);
	}

	if (!addressResponse.ok) {
		error(400, `Failed to load default address: ${addressResponse.statusText}`);
	}

	// Parse both responses in parallel
	const [shopCart, defaultAddress] = await Promise.all([
		cartResponse.json(),
		addressResponse.json()
	]);

	// Return all data
	return {
		cart: shopCart.data,
		defaultAddress: defaultAddress.data
	};
};
