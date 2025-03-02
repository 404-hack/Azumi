import { hcWithType } from '@repo/server/hc';
import type { Player } from '@repo/types/player';
export const client = hcWithType('http://127.0.0.1:8787', {
	init: {
		credentials: 'include'
	}
}).api;
