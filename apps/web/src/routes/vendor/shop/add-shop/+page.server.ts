import { superValidate } from 'sveltekit-superforms/server';
import { createStoreSchema } from '$lib/formSchema';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { client } from '$lib/hc';

export const load = (async () => {
  const form = await superValidate(createStoreSchema);
  return { form };
}) satisfies PageServerLoad;

export const actions = {
  default: async ({ request }) => {
    const form = await superValidate(request, createStoreSchema);

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const result = await client.shop.create.$post({
        json: form.data
      });
      
      if (result.error) {
        return fail(400, { 
          form,
          error: result.error 
        });
      }

      return { 
        form,
        success: true 
      };
    } catch (error) {
      return fail(500, { 
        form,
        error: 'Failed to create shop'
      });
    }
  }
} satisfies Actions;
