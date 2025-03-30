import { PUBLIC_API_BASE_URL } from '$env/static/public';
import type { TUser } from '@repo/server/types';
import { inferAdditionalFields, organizationClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/svelte';
export const authClient = createAuthClient({
	baseURL: PUBLIC_API_BASE_URL, // the base url of your auth server,
	plugins: [
		organizationClient(),
		inferAdditionalFields({
			user: {
				tokens: {
					type: 'number'
				},
				credits: {
					type: 'number'
				}
			}
		})
	]
});
