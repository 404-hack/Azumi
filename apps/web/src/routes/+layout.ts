export const ssr = false;
import { authClient } from '$lib/auth-client';

export const load = async () => {
	const session = await authClient.getSession();

	return {
		user: session.data?.user
	};
};
