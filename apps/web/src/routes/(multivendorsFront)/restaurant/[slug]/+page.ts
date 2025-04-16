import { client } from '$lib/hc';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const { slug } = params;
	const data = await client.shop[':slug'].$get({
		param: {
			slug: slug
		}
	});

	if (!data.ok) {
		error(400, 'Failed to fetch restaurant data');
	}
	const restaurantData = await data.json();
	const shopCart = await client.cart.shop[':shopId'].$get({
		param: {
			shopId: restaurantData.data.id
		}
	});
	const cartData = await shopCart.json();
	return {
		restaurant: restaurantData.data,
		shopCart: cartData.data
	};
};
