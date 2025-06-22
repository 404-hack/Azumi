import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ url }) => {
	// Allow access to debug routes only in development or if specifically enabled
	if (url.pathname.startsWith('/debug')) {
		// You can add environment checks here if needed
		// For now, allow access to debug routes
		return {};
	}
};
