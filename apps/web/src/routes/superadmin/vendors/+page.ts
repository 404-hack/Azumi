import { client } from '$lib/hc';
import type { PageLoad } from './$types';

export const load = (async ({ url, fetch }) => {
	const searchParams = url.searchParams;
	const search = searchParams.get('search') || '';
	const status = searchParams.get('status') || undefined;
	const isVerified = searchParams.get('isVerified') || undefined;

	const res = await client.admin.vendors.$get({
		fetch,
		query: {
			search,
			status,
			isVerified
		}
	});

	const { data } = await res.json();

	return {
		vendors: data
	};
}) satisfies PageLoad;
