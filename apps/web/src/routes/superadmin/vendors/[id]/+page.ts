import { client } from '$lib/hc';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	try {
		const vendorId = params.id;

		if (!vendorId) {
			error(400, 'Vendor ID is required');
		}

		const res = await client.admin.vendors[':id'].$get({
			param: {
				id: vendorId
			}
		});
		const { data: vendor } = await res.json();

		return {
			vendor: vendor
		};
	} catch (err) {
		console.error('Failed to load vendor:', err);
		error(404, 'Vendor not found');
	}
};
