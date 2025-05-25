import { client } from '$lib/hc';
import { error } from '@sveltejs/kit';

export const load = async ({ params, fetch }) => {
	try {
		// Fetch rider details using the ID from params
		const response = await client.admin.riders[':id'].$get({
			param: {
				id: params.id
			}
		});
		const data = await response.json();

		if (!data.success) {
			throw error(404, 'Rider not found');
		}

		// Log rider data for debugging
		console.log('Rider data loaded:', data.data);

		return {
			rider: data.data
		};
	} catch (err) {
		console.error('Error loading rider:', err);
		error(404, 'Rider not found');
	}
};
