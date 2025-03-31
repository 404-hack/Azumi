export const prerender = 'auto';
export const ssr = false;
import { authClient } from '$lib/auth-client';

export const load = async () => {
	const session = await authClient.getSession();
	console.log('🚀 ~ load ~ session:', session);

	return {
		user: session.data?.user
	};
};
