import { client } from '$lib/hc';
import { error } from '@sveltejs/kit';

export const load = async () => {
	const res = await client.vendor.menu.categories.$get();

	if (!res.ok) {
		const data = await res.json();
		error(500, data.message);
	}
	const categories = await res.json();
	return {
		categories: categories.data
	};
};
