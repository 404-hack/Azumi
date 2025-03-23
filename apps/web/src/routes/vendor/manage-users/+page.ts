import { authClient } from '$lib/auth-client';

export const load = async () => {
	const organization = await authClient.organization.getFullOrganization();
	console.log('🚀 ~ load ~ organization:', organization);
};
