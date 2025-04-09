import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { client } from '$lib/hc';

export const load: PageLoad = async ({ params }) => {
	const optionId = params.id;

	const response = await client.vendor.option[':id'].$get({
		param: { id: optionId }
	});

	if (!response.ok) {
		error(400, `Failed to fetch option: ${response.statusText}`);
	}

	const result = await response.json();
	const option = result.data;

	return {
		option: option
	};
};
