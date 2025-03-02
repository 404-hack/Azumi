import type { TUser } from '@repo/server/types';
import { inferAdditionalFields, organizationClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/svelte';
export const authClient = createAuthClient({
	baseURL: 'http://127.0.0.1:8787/', // the base url of your auth server,
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
