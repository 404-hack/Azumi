import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { hcWithType } from '@repo/server/hc';
export const client = hcWithType(PUBLIC_API_BASE_URL, {
	init: {
		credentials: 'include'
	}
}).api;
