import { error } from '@sveltejs/kit';
import { client } from '$lib/hc';

export const load = async ({ params }) => {
	const { id } = params;
	
	try {
		const response = await client.pack[':id'].$get({
			param: { id }
		});
		
		if (!response.ok) {
			throw new Error('Failed to fetch food pack');
		}
		
		const data = await response.json();
		
		return {
			pack: data.data
		};
	} catch (err) {
		console.error('Error loading food pack:', err);
		throw error(404, 'Food pack not found');
	}
};