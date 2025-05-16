import { client } from '$lib/hc';
import { error } from '@sveltejs/kit';

export async function load({ params: { id } }) {
	const menuRes = await client.vendor.menu[':id'].$get({
		param: { id }
	});

	if (!menuRes.ok) {
		error(404, 'Menu item not found');
	}

	const menuData = await menuRes.json();
	const res = await (await client.vendor.menu.categories.$get()).json();

	return {
		menu: menuData.data,
		categories: res.data || [],
		// optionGroups: menuData.data.menuItemOptionGroups?.map((g) => g.optionGroup) || [],
		// packs: menuData.data.pack || [],
		options: []
	};
}
