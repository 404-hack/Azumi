import { client } from '$lib/hc';
import type { PageLoad } from './$types';

export const load = (async ({ url, fetch }) => {
	const searchParams = url.searchParams;
	const search = searchParams.get('search') || '';
	const applicationStatus = searchParams.get('applicationStatus') || undefined;
	const isVerified = searchParams.get('isVerified') || undefined;
	const availabilityStatus = searchParams.get('availabilityStatus') || undefined;
	const active = searchParams.get('active') || undefined;

	// Fetch all riders with filtering options
	const ridersRes = await client.admin.riders.$get({
		fetch,
		query: {
			search,
			applicationStatus,
			isVerified,
			availabilityStatus,
			active
		}
	});

	const ridersData = await ridersRes.json();

	// Fetch pending applications (filter by PENDING status)
	const pendingRes = await client.admin.riders.$get({
		fetch,
		query: {
			applicationStatus: 'PENDING'
		}
	});

	const pendingData = await pendingRes.json();

	return {
		riders: ridersData.success ? ridersData.data : [],
		pendingApplications: pendingData.success ? pendingData.data : []
	};
}) satisfies PageLoad;
