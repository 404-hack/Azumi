import { client } from '$lib/hc';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	try {
		const categoryId = params.id;

		// Fetch the category details
		const categoryRes = await client.vendor.menu.category[':id'].$get({
			param: { id: categoryId },
			query: {
				includeMenus: true
			}
		});

		if (!categoryRes.ok) {
			error(404, 'Category not found');
		}

		const category = await categoryRes.json();

		if (!category.data) {
			error(404, 'Category not found');
		}
		return {
			category: category.data
		};
	} catch (err) {
		console.error('Error loading category data:', err);
		throw error(500, 'Error loading category data');
	}
};
