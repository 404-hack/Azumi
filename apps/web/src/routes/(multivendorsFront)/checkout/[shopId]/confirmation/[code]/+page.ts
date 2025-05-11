// filepath: c:\Users\HP\Documents\program\african-martket-monorepo\apps\web\src\routes\(multivendorsFront)\checkout\[shopId]\confirmation\[code]\+page.ts
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { client } from '$lib/hc.js'; // Adjusted import path

export const load: PageLoad = async ({ params, fetch }) => {
	try {
		const orderCode = params.code;
		// Use the Hono client to fetch the order by code
		const response = await client.order[':id'].$get(
			{
				param: {
					id: orderCode
				}
			},
			{ fetch: fetch } // Pass fetch to the client call
		);

		if (!response.ok) {
			try {
				// Attempt to get more details from the body
				const errorData = await response.json();
				error(response.status, `Failed to fetch order: ${errorData.error || response.statusText}`);
			} catch (e) {
				// Fallback if parsing fails
				error(response.status, `Failed to fetch order: ${response.statusText}`);
			}
		}

		const result = await response.json();
		const order = result.data; // Assuming the API returns { data: orderDetails }
		console.log('🚀 ~ constload:PageLoad= ~ order:', order);

		if (!order) {
			error(404, 'Order not found');
		}

		return {
			order,
			shopId: params.shopId // Pass shopId if needed elsewhere
		};
	} catch (err: any) {
		console.error('Load function error:', err);
		// Use the error function to propagate HTTP errors
		if (err.status) {
			return err;
		}
		// For other errors, return a generic 500
		error(500, `Internal Server Error: ${err.message || 'Unknown error'}`);
	}
};
