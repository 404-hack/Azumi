import { client } from '$lib/hc';

export const load = async ({ fetch }) => {
	const res = await client.shop.vendor.$get({ fetch });
	const storeData = await res.json();
	// console.log("🚀 ~ load ~ res:", res)
	console.log('🚀 ~ load ~ storeData:', storeData);
};
