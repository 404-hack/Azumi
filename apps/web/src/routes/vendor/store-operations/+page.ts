import { client } from '$lib/hc';
import { error } from '@sveltejs/kit';

export const load = async () => {
	const profileRes = await client.vendor.profile.$get();
	if (!profileRes.ok) {
		const data = await profileRes.json();
		error(500, data.message);
	}
	const profile = await profileRes.json();
	return {
		profile: profile.data
	};
};
