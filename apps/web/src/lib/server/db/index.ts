import * as schema from './schema';

import { drizzle } from 'drizzle-orm/d1';

export function createDb(dbInstance: D1Database) {
	const db = drizzle(dbInstance, { schema,casing:'snake_case' });
	return db;
}
