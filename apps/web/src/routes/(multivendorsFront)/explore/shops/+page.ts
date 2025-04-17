import { client } from '$lib/hc';
import { error, redirect } from '@sveltejs/kit';
import { activeLocation } from '$lib/states/locationState.svelte';
console.log('🚀 ~ activeLocation:', activeLocation.current);
// if (activeLocation.current.lat === 0 && activeLocation.current.lng === 0) {
// 	redirect(308, '/');
// }
export const load = async ({ url }) => {
	// get the category from the query params
	const category = url.searchParams.get('category') || 'all';
	if (activeLocation.current.lat === 0 && activeLocation.current.lng === 0) {
		redirect(308, '/');
	}
	const response = await client.shop['near-me'].$get({
		query: {
			latitude: activeLocation.current.lat,
			longitude: activeLocation.current.lng,
			shopType: category,
			distance: 1000
		}
	});
	if (!response.ok) {
		error(400, 'Failed to fetch restaurant data');
	}

	const { data } = await response.json();

	return {
		userLocation: data.userLocation,
		shops: data.shops
	};
};
