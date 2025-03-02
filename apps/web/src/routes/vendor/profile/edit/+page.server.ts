import { superValidate } from 'sveltekit-superforms';
import { vendorProfileSchema } from '$lib/schemas/vendor';
import { fail } from '@sveltejs/kit';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async () => {
	// Mock data - replace with actual DB fetch
	const form = await superValidate(
		{
			storeName: 'Tasty Bites Restaurant',
			address: '123 Foodie Street',
			city: 'Flavor Town',
			zipCode: 'FT 12345',
			phone: '+1234567890',
			description: 'Authentic local cuisine with a modern twist',
			logo: 'https://avatars.githubusercontent.com/u/15007104?v=4'
		},
		zod(vendorProfileSchema)
	);

	return { form };
};

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod(vendorProfileSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		// TODO: Update database with form.data
		console.log('Form data:', form.data);

		return { form };
	}
};
