import { z } from 'zod';

const orderItemSchema = z.object({
	id: z.string(),
	name: z.string(),
	quantity: z.number().min(1),
	price: z.number().min(0),
	options: z
		.array(
			z.object({
				name: z.string(),
				price: z.number().min(0)
			})
		)
		.optional(),
	specialInstructions: z.string().optional()
});

export const orderSchema = z.object({
	id: z.string(),
	orderNumber: z.string(),
	customerName: z.string(),
	customerPhone: z.string(),
	items: z.array(orderItemSchema),
	status: z.enum(['new', 'preparing', 'ready', 'completed', 'cancelled']),
	total: z.number().min(0),
	createdAt: z.date(),
	updatedAt: z.date(),
	estimatedReadyTime: z.date().optional(),
	paymentStatus: z.enum(['pending', 'paid', 'failed']),
	paymentMethod: z.enum(['cash', 'card', 'mobile_money']),
	deliveryAddress: z.string().optional(),
	deliveryInstructions: z.string().optional()
});

export const updateOrderStatusSchema = z.object({
	status: z.enum(['new', 'preparing', 'ready', 'completed', 'cancelled']),
	estimatedReadyTime: z.date().optional()
});
