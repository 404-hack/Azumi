import { client } from '$lib/hc';
import { error } from '@sveltejs/kit';

export const load = async () => {
	const optionsRes = await client.vendor.options.$get();
	if (!optionsRes.ok) {
		error(optionsRes.status, 'an error occurred');
	}
	const optionsData = (await optionsRes.json()).data;
	return {
		options: optionsData
	};
};
