import { client } from '$lib/hc';
import type { PageLoad } from './$types';

export const load = (async ({ params, fetch }) => {
	const orderId = params.id;

	const [orderRes, ridersRes] = await Promise.all([
		client.admin.orders[':id'].$get({
			param: { id: orderId },
			fetch
		}),
		client.admin.orders[':id']['available-riders'].$get({
			param: { id: orderId },
			fetch
		})
	]);
	const orderData = await orderRes.json();
	const ridersData = await ridersRes.json();

	return {
		order: orderData.data,
		availableRiders: ridersData.data?.availableRiders || []
	};
}) satisfies PageLoad;
