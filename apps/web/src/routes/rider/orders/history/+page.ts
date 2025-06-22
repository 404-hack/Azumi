import type { PageLoad } from './$types';
import { riderOrderService } from '$lib/services/riderOrderService';

export const load: PageLoad = async () => {
	try {
		const orderHistory = await riderOrderService.getOrderHistory();
		return {
			orderHistory
		};
	} catch (error) {
		console.error('Failed to load rider order history:', error);
		return {
			orderHistory: []
		};
	}
};
