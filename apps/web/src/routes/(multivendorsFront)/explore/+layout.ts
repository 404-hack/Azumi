import { client } from '$lib/hc.js';
import { activeLocation } from '$lib/states/locationState.svelte';
import { redirect } from '@sveltejs/kit';

export const load = async () => {
	if (activeLocation.current.lat === 0 && activeLocation.current.lng === 0) {
		redirect(308, '/');
	}

	let shopTypes = (await (await client.shop.shopTypes.$get()).json()).data;
	return {
		shopTypes
	};
};
