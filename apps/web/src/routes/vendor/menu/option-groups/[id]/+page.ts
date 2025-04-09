import { client } from '$lib/hc';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const { id } = params;
	// Fetch the option group details using the ID from the URL params
	const response = await client.vendor['option-group'][':id'].$get({
		param: { id }
	});
	if (!response.ok) {
		error(400, 'Failed to fetch option group details');
	}

	const responseData = await response.json();
	return {
		optionGroup: responseData.data
	};
};
