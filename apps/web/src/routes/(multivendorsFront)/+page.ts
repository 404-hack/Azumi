import { client } from '$lib/hc';
import { error } from '@sveltejs/kit';

export const load = async () => {
	const response = await client.shop.nearBy.$get();
	if (!response.ok) {
		error(400, 'Failed to fetch restaurant data');
	}
	const { data } = await response.json();

	return {
		userLocation: data.userLocation
	};
};
