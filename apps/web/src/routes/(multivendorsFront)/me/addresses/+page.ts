import { client } from '$lib/hc';
import { error } from '@sveltejs/kit';

export const load = async () => {
	const response = await client.address.$get();
	if (!response.ok) {
		error(400, 'Failed to fetch addresses');
	}
	const addresses = await response.json();
	return {
		addresses: addresses.data
	};
};
