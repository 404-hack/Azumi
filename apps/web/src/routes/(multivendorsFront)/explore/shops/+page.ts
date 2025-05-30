import { client } from '$lib/hc';
import { error, redirect } from '@sveltejs/kit';
import { activeLocation } from '$lib/states/locationState.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url }) => {
	// Get the category from the query params
	const category = url.searchParams.get('category') || 'restaurant';

	// Redirect if no location is set
	// if (activeLocation.current.lat === 0 && activeLocation.current.lng === 0) {
	// 	redirect(308, '/');
	// }

	// Extract simplified filter parameters from URL
	const openNow = url.searchParams.get('openNow');
	const feeMin = url.searchParams.get('feeMin');
	const feeMax = url.searchParams.get('feeMax');
	const rating = url.searchParams.get('rating');
	const discount = url.searchParams.get('discount');
	const sort = url.searchParams.get('sort') || 'recommended';

	// Build the API query object with base parameters
	const queryParams = {
		latitude: activeLocation.current.lat.toString(),
		longitude: activeLocation.current.lng.toString(),
		shopType: category,
		distance: '30'
	} as Record<string, string>;

	// Add filter parameters if they exist
	if (openNow) queryParams.openNow = openNow;
	if (feeMin) queryParams.feeMin = feeMin;
	if (feeMax) queryParams.feeMax = feeMax;
	if (rating) queryParams.rating = rating;
	if (discount) queryParams.discount = discount;
	if (sort) queryParams.sort = sort;

	console.log('Fetching shops with query params:', queryParams);

	// Call the API with all parameters
	const response = await client.shop['near-me'].$get({
		query: queryParams
	});

	if (!response.ok) {
		error(400, 'Failed to fetch restaurant data');
	}

	const { data } = await response.json();

	console.log('🚀 ~ constload:PageLoad= ~ data:', data);
	return {
		userLocation: data.userLocation,
		shops: data.shops
	};
};
