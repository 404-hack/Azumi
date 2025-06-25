import { client } from '$lib/hc';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	try {
		const [statsResponse, ordersResponse] = await Promise.all([
			client.admin.dashboard.stats.$get(),
			client.admin.orders.$get({ query: { limit: '5' } })
		]);

		const stats = statsResponse.ok ? (await statsResponse.json()).data : null;
		const ordersData = ordersResponse.ok ? await ordersResponse.json() : null;
		const orders = ordersData?.data || [];

		return {
			stats: stats || {
				totalOrders: 0,
				totalRevenue: 0,
				totalVendors: 0,
				totalRiders: 0,
				totalCustomers: 0,
				activeDeliveries: 0,
				averageDeliveryTime: 0,
				platformCommission: 15
			},
			recentOrders: orders.slice(0, 5).map((order: any) => ({
				id: order.id,
				orderCode: order.code || order.id.slice(-6),
				customer: order.customer?.name || 'Unknown',
				vendor: order.shop?.name || 'Unknown',
				total: order.total,
				status: order.status.toLowerCase(),
				time: getTimeAgo(order.createdAt)
			}))
		};
	} catch (error) {
		console.error('Error loading dashboard data:', error);
		return {
			stats: {
				totalOrders: 0,
				totalRevenue: 0,
				totalVendors: 0,
				totalRiders: 0,
				totalCustomers: 0,
				activeDeliveries: 0,
				averageDeliveryTime: 0,
				platformCommission: 15
			},
			recentOrders: []
		};
	}
};

function getTimeAgo(date: string | Date | null): string {
	if (!date) return 'unknown';
	const now = new Date();
	const orderDate = new Date(date);
	const diffInMinutes = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60));

	if (diffInMinutes < 1) return 'just now';
	if (diffInMinutes < 60) return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`;

	const diffInHours = Math.floor(diffInMinutes / 60);
	if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

	const diffInDays = Math.floor(diffInHours / 24);
	return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
}
