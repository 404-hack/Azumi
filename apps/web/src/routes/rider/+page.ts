import { client } from '$lib/hc';
import { error } from '@sveltejs/kit';

export const load = async () => {
	try {
		const [profileRes, ordersRes] = await Promise.all([
			client.rider.profile.$get(),
			client.rider.orders.actives.$get()
		]);

		if (!profileRes.ok) {
			const data = await profileRes.json();
			error(500, data.message);
		}

		const profile = await profileRes.json();
		const orders = ordersRes.ok ? await ordersRes.json() : { data: [] };

		return {
			profile: profile.data,
			orders: orders.data || []
		};
	} catch (err) {
		console.error('Error loading rider data:', err);
		error(500, 'Failed to load rider data');
	}
};
