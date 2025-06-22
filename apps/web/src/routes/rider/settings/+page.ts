import { client } from '$lib/hc';
import { error } from '@sveltejs/kit';

export const load = async () => {
	try {
		const [profileRes, todosRes] = await Promise.all([
			client.rider.profile.$get(),
			client.rider.todos.$get()
		]);

		if (!profileRes.ok) {
			const data = await profileRes.json();
			error(500, data.message);
		}

		if (!todosRes.ok) {
			const data = await todosRes.json();
			error(500, data.message);
		}

		const profile = await profileRes.json();
		const todos = await todosRes.json();
		console.log('🚀 ~ load ~ todos:', todos);

		return {
			profile: profile.data,
			todos: todos.data
		};
	} catch (err) {
		console.error('Error loading rider data:', err);
		error(500, 'Failed to load rider data');
	}
};
