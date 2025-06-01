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
		preload: ({ type }) => type === 'font',
		transformPageChunk: ({ html }) => {
			return html
				.replace(/<div class="container/g, '<main class="container')
				.replace(/<div class="flex flex-col/g, '<section class="flex flex-col')
				.replace(/<div class="grid/g, '<section class="grid');
		}
	});

	if (event.request.headers.get('accept')?.includes('text/html')) {
		response.headers.set('X-Frame-Options', 'DENY');
		response.headers.set('X-Content-Type-Options', 'nosniff');
		response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
		response.headers.set(
			'Permissions-Policy',
			'accelerometer=(), camera=(), geolocation=*, gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
		);
	}

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
