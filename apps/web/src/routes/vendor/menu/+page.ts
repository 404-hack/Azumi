import { client } from '$lib/hc';
import { error } from '@sveltejs/kit';

export const load = async () => {
	const res = await (await client.menu.vendor.$get()).json();
	const optionsRes = await client.option.vendor.$get();
	const optionGroupsRes = await client.option.vendor.optionGroup.$get();

	if (!optionsRes.ok) {
		error(optionsRes.status, 'an error occurred');
	}

	if (!optionGroupsRes.ok) {
		error(optionGroupsRes.status, 'Failed to fetch option groups');
	}

	const optionData = (await optionsRes.json()).data;
	const optionGroupsData = (await optionGroupsRes.json()).data;

	return {
		menuCategoryWithItems: res.data,
		options: optionData,
		optionGroups: optionGroupsData
	};
};
