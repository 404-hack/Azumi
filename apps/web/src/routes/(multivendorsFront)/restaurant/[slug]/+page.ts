import { client } from '$lib/hc';
import { activeLocation } from '$lib/states/locationState.svelte';
import { redirect } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
export const load = async ({ params }) => {
	if (activeLocation.current.lat === 0 && activeLocation.current.lng === 0) {
		redirect(308, '/');
	}
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
		},
		query: {
			longitude: activeLocation.current.lng,
			latitude: activeLocation.current.lat
		}
	});
	const cartData = await shopCart.json();
	return {
		restaurant: restaurantData.data,
		shopCart: cartData.data
	};
};
