import { client } from '$lib/hc';
import { error } from '@sveltejs/kit';

export const load = async () => {
	const optionsRes = await client.vendor.options.$get();
	const optionGroupsRes = await client.vendor['option-groups'].$get();

	const res = await client.vendor.menu.categories.$get({
		query: {
			includeMenus: true
		}
	});
	const categories = (await res.json()).data;
	if (!optionsRes.ok) {
		error(optionsRes.status, 'an error occurred');
	}

	if (!optionGroupsRes.ok) {
		error(optionGroupsRes.status, 'Failed to fetch option groups');
	}

	const optionData = (await optionsRes.json()).data;
	const optionGroupsData = (await optionGroupsRes.json()).data;

	return {
		menuCategoryWithItems: categories,
		options: optionData,
		optionGroups: optionGroupsData
	};
};
