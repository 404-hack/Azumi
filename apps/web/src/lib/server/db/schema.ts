import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { nanoid } from 'nanoid';

export const timestamps = {
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$default(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$onUpdate(() => new Date())
};

export function array<T>(name: string) {
	return text(name, { mode: 'json' }).$type<T[]>();
}

export const shopTypeTable = sqliteTable('shopType', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => nanoid()),
	name: text('name').notNull(),
	...timestamps
});

export const shopTable = sqliteTable('shop', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => nanoid()),
	name: text('name').notNull(),
	email: text('email').notNull(),
	shopType: text('shop_type')
		.references(() => shopTypeTable.id)
		.notNull(),
	phoneNumber: text('phone_number').notNull(),
	address: text('address').notNull(),

	...timestamps
});
