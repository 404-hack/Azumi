import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { inventoryImagesSchema, inventorySchema } from '$lib/schema';
import { fail, message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { redirect } from '@sveltejs/kit';

export const load = async ({ fetch, params, url }) => {
	const { productSlug } = params;

	const form = await superValidate(zod(inventorySchema), {
		errors: false
	});
	const imageForm = await superValidate(zod(inventoryImagesSchema));
	const product = await (await fetch(`${PUBLIC_API_BASE_URL}/product/${productSlug}`)).json();
	const productTypes = await (await fetch(`${PUBLIC_API_BASE_URL}/product_types`)).json();
	return {
		form,
		imageForm,
		product,
		productTypes
	};
};

export const actions = {
	default: async ({ request, fetch }) => {
		const form = await superValidate(request, zod(inventorySchema));

		if (!form.valid) {
			return fail(400, { form });
		}
		const data = form.data;

		try {
			const res = await fetch(`${PUBLIC_API_BASE_URL}/inventory/add`, {
				method: 'POST',
				body: JSON.stringify({
					product_type: data.productType,
					product: data.productId,
					is_active: data.is_active,
					is_digital: data.is_digital,
					retail_price: data.retail_price,
					discount_price: data.discount_price,
					attributes: data.attributes.map((attr) => ({
						attribute_value: attr.attribute_value,
						product_attribute: attr.id
					})),
					stock: {
						units: data.unit
					},
					description: data.description,
					uploaded_images: form.data.media
				})
			});

			if (!res.ok) {
				return message(form, { type: 'error', text: 'an error occurred' });
			}
		} catch (error) {
			console.log('🚀 ~ default: ~ error:', error);
		}
		redirect(303, 'inventories');
	}
};
