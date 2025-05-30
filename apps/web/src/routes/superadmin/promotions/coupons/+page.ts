import { client } from '$lib/hc';

export const load = async ({ fetch, url }) => {
	// Get query parameters for pagination if needed
	const page = url.searchParams.get('page') || '1';
	const limit = url.searchParams.get('limit') || '10';

	// Fetch coupons using Hono client
	const couponsRes = await client.admin.promotions.$get({
		fetch,
		query: {
			page,
			limit
		}
	});

	const { data } = await couponsRes.json();

	return {
		coupons: data.data,
		pagination: data.pagination
	};
};
