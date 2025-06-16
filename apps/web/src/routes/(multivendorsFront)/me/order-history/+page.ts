import type { PageLoad } from './$types';
import { customerOrderService } from '$lib/services/customerOrderService';

export const load: PageLoad = async () => {
	try {
		const orderHistory = await customerOrderService.getOrderHistory();

		return {
			orderList: orderHistory
		};
	} catch (error) {
		console.error('Failed to load order history:', error);
		return {
			orderList: []
		};
	}
};
