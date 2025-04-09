import { authClient } from '$lib/auth-client.js';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const { id } = params;
	const res = await authClient.organization.getInvitation({
		query: {
			id
		}
	});
	if (res.error) {
		error(res.error.status, res.error.message);
	}
	return {
		invitation: res.data
	};
};
