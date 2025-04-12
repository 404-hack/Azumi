// import { client } from '$lib/hc';
// import { error, redirect } from '@sveltejs/kit';
// import { activeLocation } from '$lib/states/locationState.svelte';
// if (activeLocation.current.lat > 0 && activeLocation.current.lng > 0) {
// 	redirect(308, '/explore');
// }
// export const load = async () => {
// 	const response = await client.shop.nearby.$get({
// 		params: {
// 			latitude: activeLocation.current.lat
// 		}
// 	});
// 	if (!response.ok) {
// 		error(400, 'Failed to fetch restaurant data');
// 	}

// 	const { data } = await response.json();

// 	return {
// 		userLocation: data.userLocation
// 	};
// };
