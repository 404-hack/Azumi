import { relations } from "drizzle-orm/relations";
import { userTable, addresses, searchHistory, order, userActivity, menuItem, userMetrics, account, session, optionGroup, cartItemOptions, option, cartItems, carts, shopTable, deliveryZones, deliveries, invitation, member, shopAgreements, shopOperatingHours, shopPaymentMethod, shopTodo, menuCategory, menuItemOptionGroups, pack, optionSelection, optionToOptionGroup, promotions, promotionProducts, paymentMethod, transaction, loyaltyPoints, loyaltyProgram, pointsTransaction, deviceToken, notificationPreference, notification, orderItemOption, orderItem, riders, shopType } from "./schema";

export const addressesRelations = relations(addresses, ({one, many}) => ({
	userTable: one(userTable, {
		fields: [addresses.userId],
		references: [userTable.id]
	}),
	orders: many(order),
}));

export const userTableRelations = relations(userTable, ({many}) => ({
	addresses: many(addresses),
	searchHistories: many(searchHistory),
	userActivities: many(userActivity),
	userMetrics: many(userMetrics),
	accounts: many(account),
	sessions: many(session),
	carts: many(carts),
	invitations: many(invitation),
	members: many(member),
	shopAgreements: many(shopAgreements),
	packs: many(pack),
	optionGroups: many(optionGroup),
	options: many(option),
	paymentMethods: many(paymentMethod),
	transactions: many(transaction),
	loyaltyPoints: many(loyaltyPoints),
	pointsTransactions: many(pointsTransaction),
	deviceTokens: many(deviceToken),
	notificationPreferences: many(notificationPreference),
	notifications: many(notification),
	orders_riderId: many(order, {
		relationName: "order_riderId_userTable_id"
	}),
	orders_customerId: many(order, {
		relationName: "order_customerId_userTable_id"
	}),
	riders: many(riders),
}));

export const searchHistoryRelations = relations(searchHistory, ({one}) => ({
	userTable: one(userTable, {
		fields: [searchHistory.userId],
		references: [userTable.id]
	}),
}));

export const userActivityRelations = relations(userActivity, ({one}) => ({
	order: one(order, {
		fields: [userActivity.orderId],
		references: [order.id]
	}),
	menuItem: one(menuItem, {
		fields: [userActivity.itemId],
		references: [menuItem.id]
	}),
	userTable: one(userTable, {
		fields: [userActivity.userId],
		references: [userTable.id]
	}),
}));

export const orderRelations = relations(order, ({one, many}) => ({
	userActivities: many(userActivity),
	transactions: many(transaction),
	orderItems: many(orderItem),
	address: one(addresses, {
		fields: [order.deliveryAddressId],
		references: [addresses.id]
	}),
	cart: one(carts, {
		fields: [order.cartId],
		references: [carts.id]
	}),
	userTable_riderId: one(userTable, {
		fields: [order.riderId],
		references: [userTable.id],
		relationName: "order_riderId_userTable_id"
	}),
	shopTable: one(shopTable, {
		fields: [order.shopId],
		references: [shopTable.id]
	}),
	userTable_customerId: one(userTable, {
		fields: [order.customerId],
		references: [userTable.id],
		relationName: "order_customerId_userTable_id"
	}),
}));

export const menuItemRelations = relations(menuItem, ({one, many}) => ({
	userActivities: many(userActivity),
	cartItems: many(cartItems),
	menuItemOptionGroups: many(menuItemOptionGroups),
	shopTable: one(shopTable, {
		fields: [menuItem.shopId],
		references: [shopTable.id]
	}),
	pack: one(pack, {
		fields: [menuItem.packId],
		references: [pack.id]
	}),
	menuCategory: one(menuCategory, {
		fields: [menuItem.categoryId],
		references: [menuCategory.id]
	}),
	orderItems: many(orderItem),
}));

export const userMetricsRelations = relations(userMetrics, ({one}) => ({
	userTable: one(userTable, {
		fields: [userMetrics.userId],
		references: [userTable.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	userTable: one(userTable, {
		fields: [account.userId],
		references: [userTable.id]
	}),
}));

export const sessionRelations = relations(session, ({one}) => ({
	userTable: one(userTable, {
		fields: [session.userId],
		references: [userTable.id]
	}),
}));

export const cartItemOptionsRelations = relations(cartItemOptions, ({one}) => ({
	optionGroup: one(optionGroup, {
		fields: [cartItemOptions.optionGroupId],
		references: [optionGroup.id]
	}),
	option: one(option, {
		fields: [cartItemOptions.optionId],
		references: [option.id]
	}),
	cartItem: one(cartItems, {
		fields: [cartItemOptions.cartItemId],
		references: [cartItems.id]
	}),
}));

export const optionGroupRelations = relations(optionGroup, ({one, many}) => ({
	cartItemOptions: many(cartItemOptions),
	menuItemOptionGroups: many(menuItemOptionGroups),
	userTable: one(userTable, {
		fields: [optionGroup.userId],
		references: [userTable.id]
	}),
	shopTable: one(shopTable, {
		fields: [optionGroup.shopId],
		references: [shopTable.id]
	}),
	optionSelections: many(optionSelection),
	optionToOptionGroups: many(optionToOptionGroup),
	orderItemOptions: many(orderItemOption),
}));

export const optionRelations = relations(option, ({one, many}) => ({
	cartItemOptions: many(cartItemOptions),
	optionSelections: many(optionSelection),
	userTable: one(userTable, {
		fields: [option.userId],
		references: [userTable.id]
	}),
	shopTable: one(shopTable, {
		fields: [option.shopId],
		references: [shopTable.id]
	}),
	optionToOptionGroups: many(optionToOptionGroup),
	orderItemOptions: many(orderItemOption),
}));

export const cartItemsRelations = relations(cartItems, ({one, many}) => ({
	cartItemOptions: many(cartItemOptions),
	menuItem: one(menuItem, {
		fields: [cartItems.menuItemId],
		references: [menuItem.id]
	}),
	cart: one(carts, {
		fields: [cartItems.cartId],
		references: [carts.id]
	}),
}));

export const cartsRelations = relations(carts, ({one, many}) => ({
	cartItems: many(cartItems),
	shopTable: one(shopTable, {
		fields: [carts.shopId],
		references: [shopTable.id]
	}),
	userTable: one(userTable, {
		fields: [carts.customerId],
		references: [userTable.id]
	}),
	orders: many(order),
}));

export const shopTableRelations = relations(shopTable, ({one, many}) => ({
	carts: many(carts),
	deliveryZones: many(deliveryZones),
	invitations: many(invitation),
	members: many(member),
	shopAgreements: many(shopAgreements),
	shopOperatingHours: many(shopOperatingHours),
	shopPaymentMethods: many(shopPaymentMethod),
	shopTodos: many(shopTodo),
	menuCategories: many(menuCategory),
	menuItems: many(menuItem),
	packs: many(pack),
	optionGroups: many(optionGroup),
	options: many(option),
	promotions: many(promotions),
	loyaltyPoints: many(loyaltyPoints),
	loyaltyPrograms: many(loyaltyProgram),
	pointsTransactions: many(pointsTransaction),
	orders: many(order),
	shopType: one(shopType, {
		fields: [shopTable.shopType],
		references: [shopType.id]
	}),
}));

export const deliveriesRelations = relations(deliveries, ({one}) => ({
	deliveryZone: one(deliveryZones, {
		fields: [deliveries.zoneId],
		references: [deliveryZones.id]
	}),
}));

export const deliveryZonesRelations = relations(deliveryZones, ({one, many}) => ({
	deliveries: many(deliveries),
	shopTable: one(shopTable, {
		fields: [deliveryZones.shopId],
		references: [shopTable.id]
	}),
}));

export const invitationRelations = relations(invitation, ({one}) => ({
	userTable: one(userTable, {
		fields: [invitation.inviterId],
		references: [userTable.id]
	}),
	shopTable: one(shopTable, {
		fields: [invitation.organizationId],
		references: [shopTable.id]
	}),
}));

export const memberRelations = relations(member, ({one}) => ({
	userTable: one(userTable, {
		fields: [member.userId],
		references: [userTable.id]
	}),
	shopTable: one(shopTable, {
		fields: [member.organizationId],
		references: [shopTable.id]
	}),
}));

export const shopAgreementsRelations = relations(shopAgreements, ({one}) => ({
	userTable: one(userTable, {
		fields: [shopAgreements.acceptedById],
		references: [userTable.id]
	}),
	shopTable: one(shopTable, {
		fields: [shopAgreements.shopId],
		references: [shopTable.id]
	}),
}));

export const shopOperatingHoursRelations = relations(shopOperatingHours, ({one}) => ({
	shopTable: one(shopTable, {
		fields: [shopOperatingHours.shopId],
		references: [shopTable.id]
	}),
}));

export const shopPaymentMethodRelations = relations(shopPaymentMethod, ({one}) => ({
	shopTable: one(shopTable, {
		fields: [shopPaymentMethod.shopId],
		references: [shopTable.id]
	}),
}));

export const shopTodoRelations = relations(shopTodo, ({one}) => ({
	shopTable: one(shopTable, {
		fields: [shopTodo.shopId],
		references: [shopTable.id]
	}),
}));

export const menuCategoryRelations = relations(menuCategory, ({one, many}) => ({
	shopTable: one(shopTable, {
		fields: [menuCategory.shopId],
		references: [shopTable.id]
	}),
	menuItems: many(menuItem),
}));

export const menuItemOptionGroupsRelations = relations(menuItemOptionGroups, ({one}) => ({
	optionGroup: one(optionGroup, {
		fields: [menuItemOptionGroups.optionGroupId],
		references: [optionGroup.id]
	}),
	menuItem: one(menuItem, {
		fields: [menuItemOptionGroups.menuItemId],
		references: [menuItem.id]
	}),
}));

export const packRelations = relations(pack, ({one, many}) => ({
	menuItems: many(menuItem),
	userTable: one(userTable, {
		fields: [pack.userId],
		references: [userTable.id]
	}),
	shopTable: one(shopTable, {
		fields: [pack.shopId],
		references: [shopTable.id]
	}),
}));

export const optionSelectionRelations = relations(optionSelection, ({one}) => ({
	optionGroup: one(optionGroup, {
		fields: [optionSelection.optionGroupId],
		references: [optionGroup.id]
	}),
	option: one(option, {
		fields: [optionSelection.optionId],
		references: [option.id]
	}),
}));

export const optionToOptionGroupRelations = relations(optionToOptionGroup, ({one}) => ({
	optionGroup: one(optionGroup, {
		fields: [optionToOptionGroup.optionGroupId],
		references: [optionGroup.id]
	}),
	option: one(option, {
		fields: [optionToOptionGroup.optionId],
		references: [option.id]
	}),
}));

export const promotionProductsRelations = relations(promotionProducts, ({one}) => ({
	promotion: one(promotions, {
		fields: [promotionProducts.promotionId],
		references: [promotions.id]
	}),
}));

export const promotionsRelations = relations(promotions, ({one, many}) => ({
	promotionProducts: many(promotionProducts),
	shopTable: one(shopTable, {
		fields: [promotions.shopId],
		references: [shopTable.id]
	}),
}));

export const paymentMethodRelations = relations(paymentMethod, ({one, many}) => ({
	userTable: one(userTable, {
		fields: [paymentMethod.userId],
		references: [userTable.id]
	}),
	transactions: many(transaction),
}));

export const transactionRelations = relations(transaction, ({one}) => ({
	paymentMethod: one(paymentMethod, {
		fields: [transaction.paymentMethodId],
		references: [paymentMethod.id]
	}),
	order: one(order, {
		fields: [transaction.orderId],
		references: [order.id]
	}),
	userTable: one(userTable, {
		fields: [transaction.userId],
		references: [userTable.id]
	}),
}));

export const loyaltyPointsRelations = relations(loyaltyPoints, ({one}) => ({
	shopTable: one(shopTable, {
		fields: [loyaltyPoints.shopId],
		references: [shopTable.id]
	}),
	userTable: one(userTable, {
		fields: [loyaltyPoints.userId],
		references: [userTable.id]
	}),
}));

export const loyaltyProgramRelations = relations(loyaltyProgram, ({one}) => ({
	shopTable: one(shopTable, {
		fields: [loyaltyProgram.shopId],
		references: [shopTable.id]
	}),
}));

export const pointsTransactionRelations = relations(pointsTransaction, ({one}) => ({
	shopTable: one(shopTable, {
		fields: [pointsTransaction.shopId],
		references: [shopTable.id]
	}),
	userTable: one(userTable, {
		fields: [pointsTransaction.userId],
		references: [userTable.id]
	}),
}));

export const deviceTokenRelations = relations(deviceToken, ({one}) => ({
	userTable: one(userTable, {
		fields: [deviceToken.userId],
		references: [userTable.id]
	}),
}));

export const notificationPreferenceRelations = relations(notificationPreference, ({one}) => ({
	userTable: one(userTable, {
		fields: [notificationPreference.userId],
		references: [userTable.id]
	}),
}));

export const notificationRelations = relations(notification, ({one}) => ({
	userTable: one(userTable, {
		fields: [notification.userId],
		references: [userTable.id]
	}),
}));

export const orderItemOptionRelations = relations(orderItemOption, ({one}) => ({
	optionGroup: one(optionGroup, {
		fields: [orderItemOption.optionGroupId],
		references: [optionGroup.id]
	}),
	option: one(option, {
		fields: [orderItemOption.optionId],
		references: [option.id]
	}),
	orderItem: one(orderItem, {
		fields: [orderItemOption.orderItemId],
		references: [orderItem.id]
	}),
}));

export const orderItemRelations = relations(orderItem, ({one, many}) => ({
	orderItemOptions: many(orderItemOption),
	menuItem: one(menuItem, {
		fields: [orderItem.menuItemId],
		references: [menuItem.id]
	}),
	order: one(order, {
		fields: [orderItem.orderId],
		references: [order.id]
	}),
}));

export const ridersRelations = relations(riders, ({one}) => ({
	userTable: one(userTable, {
		fields: [riders.id],
		references: [userTable.id]
	}),
}));

export const shopTypeRelations = relations(shopType, ({many}) => ({
	shopTables: many(shopTable),
}));