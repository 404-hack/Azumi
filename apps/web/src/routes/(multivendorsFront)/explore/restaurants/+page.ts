import { client } from '$lib/hc';
import { error, redirect } from '@sveltejs/kit';
import { activeLocation } from '$lib/states/locationState.svelte';
console.log('🚀 ~ activeLocation:', activeLocation.current);
// if (activeLocation.current.lat === 0 && activeLocation.current.lng === 0) {
// 	redirect(308, '/');
// }
export const load = async () => {
	const response = await client.shop.nearby.$get({
		query: {
			latitude: activeLocation.current.lat,
			longitude: activeLocation.current.lng,
			shopType: 'restaurant',
			distance: 1000
		}
	});
	if (!response.ok) {
		error(400, 'Failed to fetch restaurant data');
	}

	const { data } = await response.json();

	return {
		userLocation: data.userLocation
	};
};
