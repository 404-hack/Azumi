import { client } from '$lib/hc';

export const load = async () => {
	const res = await client.vendor.menu.categories.$get({
		query: {
			includeMenus: true
		}
	});
	const categories = (await res.json()).data;
	console.log('🚀 ~ load ~ categories:', categories);
	return {
		categories
	};
};
