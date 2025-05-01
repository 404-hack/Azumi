import { and, eq } from "drizzle-orm";
import { menuItemOptionGroups, menuItemTable } from "./schema/menu.schema";
import {
  optionGroupTable,
  optionToOptionGroupTable,
} from "./schema/option.schema";
import * as schema from "./schema";

import type { DrizzleD1Database } from "drizzle-orm/d1";

export async function getMenuItemOptionGroups(
  db: DrizzleD1Database<typeof schema>,
  menuItemId: string
) {
  // Get all option groups and their options in a single query
  const menuItem = await db.query.menuItemTable.findFirst({
    where: eq(menuItemTable.id, menuItemId),
    with: {
      menuItemOptionGroups: {
        with: {
          optionGroup: {
            columns: {
              id: true,
              name: true,
              minSelections: true,
              maxSelections: true,
            },
            with: {
              optionsToOptionGroups: {
                with: {
                  option: {
                    columns: {
                      id: true,
                      name: true,
                      price: true,
                      inStock: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!menuItem?.menuItemOptionGroups) {
    return [];
  }

  // Map the results to the expected format
  return menuItem.menuItemOptionGroups
    .filter((group) => group.optionGroup)
    .map((group) => ({
      ...group.optionGroup,
      options: group.optionGroup.optionsToOptionGroups
        .map((opt) => opt.option)
        .filter(Boolean),
    }));
}
