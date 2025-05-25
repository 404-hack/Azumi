import { client } from '$lib/hc';
import { error } from '@sveltejs/kit';

export const load = async () => {
	try {
		const profileRes = await client.rider.profile.$get();

		if (!profileRes.ok) {
			const data = await profileRes.json();
			error(500, data.message);
		}

		const profile = await profileRes.json();

		return {
			profile: profile.data
		};
	} catch (err) {
		console.error('Error loading rider data:', err);
		error(500, 'Failed to load rider data');
	}
};
