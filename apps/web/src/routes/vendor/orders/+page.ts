import { authClient } from '$lib/auth-client';

export const load = async () => {
	const session = await authClient.getSession();
	console.log('from orders', session.data);
	return {
		user: session.data?.user
	};
};
