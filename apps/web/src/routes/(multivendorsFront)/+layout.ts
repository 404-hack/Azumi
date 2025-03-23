import { client } from '$lib/hc';

export const load = async () => {
	const cartsResponse = await client.cart.$get();
	const carts = await cartsResponse.json();

	return {
		carts: carts.data
	};
};
