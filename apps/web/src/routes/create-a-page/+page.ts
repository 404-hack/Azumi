export let prerender = true;

import { client } from '$lib/hc.js';

export const load = async () => {
	let shopTypes = (await (await client.shop.shopTypes.$get()).json()).data;
	return {
		shopTypes
	};
};
