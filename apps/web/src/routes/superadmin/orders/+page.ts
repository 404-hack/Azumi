import { client } from '$lib/hc';
import type { PageLoad } from './$types';

export const load = (async ({ url, fetch }) => {
	const searchParams = url.searchParams;
	const status = searchParams.get('status') || undefined;
	const search = searchParams.get('search') || '';

	const response = await client.admin.orders.$get({
		fetch,
		query: {
			status,
			search
		}
	});
	const { data } = await response.json();

	return {
		orders: data
	};
}) satisfies PageLoad;
