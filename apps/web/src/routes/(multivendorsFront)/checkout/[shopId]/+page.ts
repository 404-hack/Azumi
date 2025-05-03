import { client } from '$lib/hc.js';
import { error } from '@sveltejs/kit';
import { activeLocation } from '$lib/states/locationState.svelte.js';

export const load = async ({ params, fetch }) => {
	// Removed url, added fetch back just in case client needs it
	const { shopId } = params;

	// Fetch cart data
	const cartResponse = await client.cart.shop[':shopId'].$get(
		{
			param: {
				shopId: shopId
			},
			query: {
				latitude: activeLocation.current.lat,
				longitude: activeLocation.current.lng
			}
		},
		{ fetch: fetch }
	); // Pass fetch if needed by client setup

	if (!cartResponse.ok) {
		error(400, `Failed to load cart: ${cartResponse.statusText}`);
	}

	const shopCart = await cartResponse.json();
	console.log('🚀 ~ load ~ shopCart:', shopCart);

	// Return only cart data
	return {
		cart: shopCart.data
	};
};
