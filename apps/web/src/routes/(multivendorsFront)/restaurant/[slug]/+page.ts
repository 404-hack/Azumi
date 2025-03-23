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
	console.log('🚀 ~ load ~ restaurantData:', restaurantData);
	return {
		restaurant: restaurantData.data
	};
};
