import { z } from 'zod';

export const vendorProfileSchema = z.object({
	storeName: z.string().min(2, 'Store name must be at least 2 characters'),
	description: z.string().min(10, 'Description must be at least 10 characters'),
	address: z.string().min(5, 'Address must be at least 5 characters'),
	city: z.string().min(2, 'City must be at least 2 characters'),
	zipCode: z.string().min(4, 'ZIP code must be at least 4 characters'),
	phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'),
	logo: z.string().url('Please provide a valid image URL')
});

export type VendorProfile = typeof vendorProfileSchema.shape;
