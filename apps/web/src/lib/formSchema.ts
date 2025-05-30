import { z } from 'zod';

export const nigerianPhoneSchema = z
	.string()
	.min(1, { message: 'Phone number is required' })
	.regex(/^(?:\+?234|0)[789][01]\d{8}$/, {
		message: 'Please enter a valid Nigerian phone number'
	});
// .transform((val) => {
// 	if (val.startsWith('0')) {
// 		return '+234' + val.slice(1);
// 	}
// 	if (val.startsWith('234')) {
// 		return '+' + val;
// 	}
// 	return val;
// });

// Helper schema for phone number validation
const phoneRegex = /^\+?[1-9]\d{1,14}$/;
export const addMealSchema = z.object({
	category: z.string().min(1, { message: 'Category is required' }),
	name: z.string().min(1),
	description: z.string().min(1),
	image: z.string().min(1),
	price: z.number().min(1),
	priceDescription: z.string(),
	pack: z.string(),
	optionGroup: z.string(),
	inStock: z.boolean()
});
const isValidPhoneNumber = (phone: string): boolean => {
	const regex = /^([0|\+[0-9]{1,5})?([7-9][0-9]{9})$/;
	return regex.test(phone);
};
export const addCategorySchema = z.object({
	name: z.string().min(1),
	published: z.boolean().default(true)
});
export const addPackSchema = z.object({
	name: z.string().min(1),
	description: z.string().min(1),
	price: z.number().min(1)
});
export const createStoreSchema = z.object({
	// Existing fields
	shopName: z.string().min(3).max(30),

	// New fields from the image
	shopType: z.string().min(1, { message: 'Business type is required' }),
	address: z.string().min(1, { message: 'Street address is required' }),
	phoneNumber: nigerianPhoneSchema,
	email: z.string().email({ message: 'Invalid email format' })
});
export const productSchema = z.object({
	name: z.string().min(3).max(100),
	description: z.string().min(3).max(1000),
	category: z.number().positive()
});
export const productCategorySchema = z.object({
	name: z.string().min(3).max(100)
});
const isImageFile = (file: File) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);

export const inventorySchema = z
	.object({
		description: z
			.string()
			.min(3, 'Description must be at least 3 characters long')
			.max(225, 'Description cannot exceed 225 characters'),
		retail_price: z
			.number({
				required_error: 'Retail price is required',
				invalid_type_error: 'Retail price must be a number',
				coerce: true
			})
			.nonnegative('Retail price cannot be negative')
			.positive('Retail price must be greater than 0')
			.refine((value) => Number.isFinite(value), 'Please enter a valid retail price'),
		discount_price: z
			.number({
				required_error: 'Discount price is required',
				invalid_type_error: 'Discount price must be a number',
				coerce: true
			})

			.nonnegative('Discount price cannot be negative')

			.refine((value) => Number.isFinite(value), 'Please enter a valid discount price')
			.optional(),
		is_digital: z
			.boolean({
				required_error: 'Please specify if the product is digital',
				invalid_type_error: 'Digital status must be true or false'
			})
			.default(false),
		is_active: z
			.boolean({
				required_error: 'Please specify if the product is active',
				invalid_type_error: 'Active status must be true or false'
			})
			.default(false),
		media: z
			.array(
				z
					.instanceof(File, { message: 'Please upload valid files.' })
					.refine((f) => f.size < 100_000, 'Image size must be less than 100 KB')
					.refine(isImageFile, 'Please upload only JPEG, PNG, or WebP images')
			)
			.min(1, 'Please upload at least one image for the product'),
		attributes: z.array(
			z.object({
				attribute_value: z
					.string({
						required_error: 'Attribute value cannot be empty'
					})
					.min(1, 'Attribute value cannot be empty')
					.max(100, 'Attribute value cannot exceed 100 characters'),
				id: z.number(),
				name: z.string(),
				unit: z.string()
			})
		),
		unit: z
			.number({
				required_error: 'Unit quantity is required',
				invalid_type_error: 'Unit quantity must be a number',
				coerce: true
			})
			.nonnegative('Unit quantity cannot be negative')
			.positive('Unit quantity must be greater than 0'),

		productType: z
			.number({
				required_error: 'Product type is required',
				invalid_type_error: 'Product type must be a number'
			})
			.positive('Please select a valid product type'),
		productId: z.number({
			required_error: 'Product ID is required',
			invalid_type_error: 'Product ID must be a number'
		})
	})
	.refine(
		(data) => {
			if (data.discount_price === undefined || data.discount_price == 0) return true;
			return data.discount_price > data.retail_price;
		},
		{
			message: 'Discount price must be higher than retail price',
			path: ['discount_price']
		}
	);

export const updatePasswordSchema = z
	.object({
		currentPassword: z.string().min(8),
		newPassword: z.string().min(8),
		confirmNewPassword: z.string().min(8)
	})
	.refine((data) => data.newPassword === data.confirmNewPassword, {
		message: 'Passwords do not match',
		path: ['confirmNewPassword']
	});
export const updateNumberSchema = z.object({
	number: nigerianPhoneSchema
});
export const updateNameSchema = z.object({
	firstName: z.string().min(3),
	lastName: z.string().min(3)
});
export const updateEmailSchema = z.object({
	email: z.string().email()
});
export const requestPasswordResetSchema = z.object({
	email: z.string().email()
});
// You might also want to create a type from the schema
export type CreateStoreInput = z.infer<typeof createStoreSchema>;

export const loginSchema = z.object({
	phoneNumber: nigerianPhoneSchema
});

export const registerSchema = z.object({
	email: z.string().email(),
	firstName: z.string().min(3).max(20),
	lastName: z.string().min(3).max(20),
	phoneNumber: nigerianPhoneSchema
});

const PROMOTION_TYPES = ['percentage', 'fixed', 'bogo', 'minimum_spend'] as const;
const PROMOTION_COST_BEARER = ['VENDOR', 'PLATFORM', 'SHARED'] as const;

export const createPromotionSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	code: z.string().min(3, 'Code must be at least 3 characters').toUpperCase(),
	description: z.string().optional(),
	type: z.enum(PROMOTION_TYPES),
	value: z.number().positive('Value must be positive'),
	minOrderValue: z.number().nonnegative().optional(),
	maxDiscount: z.number().nonnegative().optional(),
	buyQuantity: z.number().int().positive().optional(),
	getQuantity: z.number().int().positive().optional(),
	startDate: z.string().datetime(),
	endDate: z.string().datetime(),
	usageLimit: z.number().int().nonnegative().optional(),
	isActive: z.boolean().default(true),
	isFirstOrderOnly: z.boolean().default(false),
	appliesToAllShops: z.boolean().default(false),
	shopIds: z.array(z.string()).optional(),
	productIds: z.array(z.string()).optional(),
	costBearer: z.enum(PROMOTION_COST_BEARER).default('VENDOR')
});

export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;
