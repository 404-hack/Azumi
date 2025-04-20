import { createDb } from '$lib/server/db';
import { authClient } from '$lib/auth-client';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { redirect } from '@sveltejs/kit';

// Protected routes configuration
const protectedPaths = [
	'/vendor',
	'/dashboard',
	'/me'
	// Add more protected routes here as needed
];

const preloadFonts: Handle = async ({ event, resolve }) => {
	const response = await resolve(event, {
		preload: ({ type }) => type === 'font'
	});
	return response;
};

const protectRoutes: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	console.log('🚀from the hook server');

	// Check if the current path needs protection
	const needsProtection = protectedPaths.some((protectedPath) => path.startsWith(protectedPath));

	if (needsProtection) {
		const session = await authClient.getSession();

		if (!session) {
			throw redirect(303, `/`);
		}

		// Add the session to the locals so it's available in routes
		event.locals.user = session.data?.user;
	}

	return await resolve(event);
};

export const handle = sequence(preloadFonts, protectRoutes);
