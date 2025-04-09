import type { PageLoad } from './$types';
import { client } from '$lib/hc';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {
	try {
		const packId = params.id;

		// Fetch the pack details using the ID from the URL params
		const response = await client.vendor.pack[':id'].$get({
			param: { id: packId }
		});

		if (!response.ok) {
			error(response.status, 'Failed to load food pack details');
		}

		const pack = await response.json();

		return {
			pack: pack.data
		};
	} catch (err) {
		console.error('Error loading food pack:', err);
		error(500, 'Error loading food pack details');
	}
};
