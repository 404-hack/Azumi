import { authClient } from '$lib/auth-client';
import { client } from '$lib/hc';

export const load = async () => {
	const organization = await authClient.organization.getFullOrganization();

	return {
		shopInfo: organization
	};
};
