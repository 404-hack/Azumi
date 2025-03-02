// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { TUser } from '@repo/server/types';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

type Schema = typeof import('./lib/server/db/schema');

declare global {
	namespace App {
		interface Platform {
			env: {
				DB: D1Database;
			};
			cf: CfProperties;
			ctx: ExecutionContext;
		}
		interface Locals {
			user: TUser;
			test: string;
		}
		interface PageData {
			user: TUser;
		}
		namespace Superforms {
			type Message = {
				type: 'error' | 'success';
				text: string;
			};
		}
	}
}

export {};
