import { client } from '$lib/hc';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ fetch, url }) => {
	try {
		// Get query parameters for pagination
		const page = url.searchParams.get('page') || '1';
		const limit = url.searchParams.get('limit') || '10';
		const shopId = url.searchParams.get('shopId') || '';

		// Fetch promotions using Hono client
		const promotionsRes = await client.admin.promotions.$get({
			fetch,
			query: {
				page,
				limit,
				...(shopId ? { shopId } : {})
			}
		});

		if (!promotionsRes.ok) {
			const errorData = await promotionsRes.json();
			error(promotionsRes.status, {
				message: errorData.message || 'Failed to fetch promotions'
			});
		}

		const promotionsData = await promotionsRes.json();

		// Calculate stats
		const now = new Date();

		const activePromotions = promotionsData.data.filter(
			(promo) =>
				promo.isActive && new Date(promo.startDate) <= now && new Date(promo.endDate) >= now
		);

		const upcomingPromotions = promotionsData.data.filter(
			(promo) => promo.isActive && new Date(promo.startDate) > now
		);

		const expiredPromotions = promotionsData.data.filter(
			(promo) => !promo.isActive || new Date(promo.endDate) < now
		);

		// Calculate total usage and discounts
		const totalRedemptions = promotionsData.data.reduce(
			(acc, promo) => acc + (promo.usageCount || 0),
			0
		);

		// Categorize promotions by type
		const promotionsByType = {
			percentage: promotionsData.data.filter((promo) => promo.type === 'percentage'),
			fixed: promotionsData.data.filter((promo) => promo.type === 'fixed'),
			bogo: promotionsData.data.filter((promo) => promo.type === 'bogo'),
			minimum_spend: promotionsData.data.filter((promo) => promo.type === 'minimum_spend')
		};

		return {
			promotions: promotionsData.data,
			pagination: promotionsData.pagination,
			overview: {
				activePromotions: activePromotions.length,
				upcomingPromotions: upcomingPromotions.length,
				expiredPromotions: expiredPromotions.length,
				totalRedemptions,
				promotionsByType
			}
		};
	} catch (err) {
		console.error('Error loading promotions:', err);
		if (err instanceof Error) {
			error(500, { message: err.message || 'Failed to load promotions data' });
		}
		error(500, { message: 'Failed to load promotions data' });
	}
}) satisfies PageLoad;
