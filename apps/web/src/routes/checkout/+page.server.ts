import { z } from 'zod';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

const checkoutSchema = z.object({
	deliveryAddress: z.object({
		name: z.string().min(1, 'Name is required'),
		street: z.string().min(1, 'Street address is required'),
		city: z.string().min(1, 'City is required'),
		state: z.string().min(1, 'State is required'),
		zipCode: z.string().min(1, 'ZIP code is required'),
		phone: z.string().min(1, 'Phone number is required'),
		instructions: z.string().optional()
	}),
	paymentMethod: z.enum(['card', 'mobile_money', 'cash']),
	items: z.array(
		z.object({
			id: z.string(),
			quantity: z.number().min(1),
			options: z
				.array(
					z.object({
						name: z.string(),
						price: z.number()
					})
				)
				.optional()
		})
	),
	subtotal: z.number().min(0),
	deliveryFee: z.number().min(0),
	platformFee: z.number().min(0),
	tax: z.number().min(0),
	total: z.number().min(0)
});

export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const data = Object.fromEntries(formData);

		try {
			const validatedData = checkoutSchema.parse({
				deliveryAddress: JSON.parse(data.deliveryAddress as string),
				paymentMethod: data.paymentMethod,
				items: JSON.parse(data.items as string),
				subtotal: Number(data.subtotal),
				deliveryFee: Number(data.deliveryFee),
				platformFee: Number(data.platformFee),
				tax: Number(data.tax),
				total: Number(data.total)
			});

			// TODO: Implement order creation logic
			// 1. Create order in database
			// 2. Process payment if payment method is card or mobile money
			// 3. Send confirmation email
			// 4. Return order details

			return {
				success: true,
				orderId: 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase()
			};
		} catch (error) {
			console.error('Checkout error:', error);
			return fail(400, {
				error: 'Invalid checkout data'
			});
		}
	}
} satisfies Actions;
