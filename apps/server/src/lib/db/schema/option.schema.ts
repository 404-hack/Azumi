import {
  pgTable,
  text,
  integer,
  primaryKey,
  boolean,
} from "drizzle-orm/pg-core";
import { timestamps } from "./utils.schema";
import { nanoid } from "nanoid";
import { shopTable } from "./shop.schema";
import { relations } from "drizzle-orm";
import { menuItemTable, menuItemOptionGroups } from "./menu.schema";
import { userTable } from "./auth.schema";

export const optionGroupTable = pgTable("optionGroup", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  minSelections: integer("min_selections").default(0).notNull(),
  maxSelections: integer("max_selections"),
  shopId: text("shop_id")
    .references(() => shopTable.id)
    .notNull(),
  userId: text("user_id")
    .references(() => userTable.id)
    .notNull(),
  ...timestamps,
});

export const optionTable = pgTable("option", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  inStock: boolean("in_stock").default(true).notNull(),
  shopId: text("shop_id")
    .references(() => shopTable.id)
    .notNull(),
  userId: text("user_id").references(() => userTable.id),
  ...timestamps,
});

export const optionToOptionGroupTable = pgTable(
  "option_to_option_group",
  {
    optionId: text("option_id")
      .references(() => optionTable.id, { onDelete: "cascade" })
      .notNull(),
    optionGroupId: text("option_group_id")
      .references(() => optionGroupTable.id, { onDelete: "cascade" })
      .notNull(),
    ...timestamps,
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.optionId, table.optionGroupId] }),
    };
  }
);

export const optionSelectionTable = pgTable("optionSelection", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  optionId: text("option_id")
    .references(() => optionTable.id, { onDelete: "cascade" })
    .notNull(),
  optionGroupId: text("option_group_id")
    .references(() => optionGroupTable.id, { onDelete: "cascade" })
    .notNull(),
  quantity: integer("quantity").default(1).notNull(),
  ...timestamps,
});

// Define relations for optionGroup
export const optionGroupRelations = relations(optionGroupTable, ({ many }) => ({
  menuItemOptionGroups: many(menuItemOptionGroups),
  optionsToOptionGroups: many(optionToOptionGroupTable),
}));

// Define relations for option
export const optionRelations = relations(optionTable, ({ many }) => ({
  optionsToOptionGroups: many(optionToOptionGroupTable),
  selections: many(optionSelectionTable),
}));

// Define relations for junction table
export const optionToOptionGroupRelations = relations(
  optionToOptionGroupTable,
  ({ one }) => ({
    option: one(optionTable, {
      fields: [optionToOptionGroupTable.optionId],
      references: [optionTable.id],
    }),
    optionGroup: one(optionGroupTable, {
      fields: [optionToOptionGroupTable.optionGroupId],
      references: [optionGroupTable.id],
    }),
  })
);

// Add relations for the new selections table
export const optionSelectionRelations = relations(
  optionSelectionTable,
  ({ one }) => ({
    option: one(optionTable, {
      fields: [optionSelectionTable.optionId],
      references: [optionTable.id],
    }),
    optionGroup: one(optionGroupTable, {
      fields: [optionSelectionTable.optionGroupId],
      references: [optionGroupTable.id],
    }),
  })
);
