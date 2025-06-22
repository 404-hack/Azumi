import { client } from '$lib/hc';
import { error, redirect } from '@sveltejs/kit';
import { activeLocation } from '$lib/states/locationState.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url }) => {
	const category = url.searchParams.get('category') || 'restaurant';

	if (activeLocation.current.lat === 0 && activeLocation.current.lng === 0) {
		redirect(308, '/');
	}

	const openNow = url.searchParams.get('openNow');
	const feeMin = url.searchParams.get('feeMin');
	const feeMax = url.searchParams.get('feeMax');
	const rating = url.searchParams.get('rating');
	const discount = url.searchParams.get('discount');
	const sort = url.searchParams.get('sort') || 'recommended';

	const queryParams = {
		latitude: activeLocation.current.lat.toString(),
		longitude: activeLocation.current.lng.toString(),
		shopType: category,
		distance: '50'
	} as Record<string, string>;

	if (openNow) queryParams.openNow = openNow;
	if (feeMin) queryParams.feeMin = feeMin;
	if (feeMax) queryParams.feeMax = feeMax;
	if (rating) queryParams.rating = rating;
	if (discount) queryParams.discount = discount;
	if (sort) queryParams.sort = sort;

	const response = await client.shop['near-me'].$get({
		query: queryParams
	});

	if (!response.ok) {
		error(400, 'Failed to fetch shop data');
	}

	const { data } = await response.json();

	return {
		userLocation: data.userLocation,
		shops: data.shops,
		category
	};
};
