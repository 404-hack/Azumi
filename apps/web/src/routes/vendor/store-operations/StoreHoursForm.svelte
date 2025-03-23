<script lang="ts">
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod, zodClient } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';
	import { client } from '$lib/hc';
	import { toast } from 'svelte-sonner';
	import { Loader } from 'lucide-svelte';
	import { dayScheduleSchema } from '@repo/server/validations';

	import { Switch } from "$lib/components/ui/switch"
	

	const storeHoursSchema = z.object({
		schedule: z.array(dayScheduleSchema)
	});

	type Props = {
		schedule?: {
			day: string;
			isOpen: boolean;
			openTime: string;
			closeTime: string;
		}[]
	};

	const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

	const defaultSchedule = days.map((day) => ({
		day,
		isOpen: false,
		openTime: '09:00',
		closeTime: '17:00'
	}));

	let { schedule = $bindable(defaultSchedule) } = $props<Props>();
	
	// Initialize form with provided schedule or default schedule
	const initialData = {
		schedule: schedule || defaultSchedule
	};

	const {form,enhance, delayed,errors} = superForm(defaults(initialData,zod(storeHoursSchema)), {
		validators: zodClient(storeHoursSchema),
		SPA: true,
		dataType:'json',
		resetForm:false,
		onUpdate: async ({ form }) => {
			if (form.valid) {
				try {
					const res = await client.vendor['operating-hours'].$post({
						json: form.data
					});
					const data = await res.json();
					if (res.ok) {
						toast.success('Store hours updated successfully');
					} else {
						toast.error(data.message || 'Failed to update store hours');
					}
				} catch (error) {
					toast.error('An error occurred while updating store hours');
					console.error(error);
				}
			}
		}
	});
	console.log("🚀 ~ const{form,enhance,delayed,errors}=superForm ~ form:", $form)

</script>

<form method="POST" use:enhance class="space-y-6">
	{#each $form.schedule as day, i}
		<div class="rounded-lg border p-4">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-medium">{day.day}</h3>
				<div class="flex items-center space-x-2">
				
					<Switch
					id="{day.day}-isOpen" 
						bind:checked={day.isOpen} 
					/>
					
					<label for="{day.day}-isOpen">
						{day.isOpen ? 'Open' : 'Closed'}
					</label>
				</div>
			</div>

			{#if day.isOpen}
				<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<label for="{day.day}-openTime">Opening Time</label>
						<input 
							type="time" 
							id="{day.day}-openTime" 
							bind:value={$form.schedule[i].openTime} 
							class="w-full rounded-md border border-gray-300 px-3 py-2"
						/>
						{#if $errors.schedule?.[i]}
							<p class="text-sm text-red-500">{$errors.schedule[i].openTime}</p>
						{/if}
					</div>

					<div class="space-y-2">
						<label for="{day.day}-closeTime">Closing Time</label>
						<input 
							type="time" 
							id="{day.day}-closeTime" 
							bind:value={$form.schedule[i].closeTime} 
							class="w-full rounded-md border border-gray-300 px-3 py-2"
						/>
						{#if $errors.schedule?.[i]?.closeTime}
							<p class="text-sm text-red-500">{$errors.schedule[i].closeTime}</p>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{/each}

	<button 
		type="submit" 
		class="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary/90"
	>
		{#if $delayed}
			<Loader class="mr-2 h-4 w-4 animate-spin" />
			<span>Saving...</span>
		{:else}
			Save Store Hours
		{/if}
	</button>
</form>
