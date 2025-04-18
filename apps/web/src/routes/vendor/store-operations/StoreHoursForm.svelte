<script lang="ts">
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod, zodClient } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';
	import { client } from '$lib/hc';
	import { toast } from 'svelte-sonner';
	import { Loader } from 'lucide-svelte';
	import { dayScheduleSchema } from '@repo/server/validations';

	import { Switch } from '$lib/components/ui/switch';

	const storeHoursSchema = z.object({
		schedule: z.array(dayScheduleSchema)
	});

	type Props = {
		schedule?: {
			day: string;
			isOpen: boolean;
			openTime: string;
			closeTime: string;
		}[];
	};

	const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	const daysOrder = {
		Monday: 0,
		Tuesday: 1,
		Wednesday: 2,
		Thursday: 3,
		Friday: 4,
		Saturday: 5,
		Sunday: 6
	};

	const defaultSchedule = days.map((day) => ({
		day,
		isOpen: false,
		openTime: '09:00',
		closeTime: '17:00'
	}));

	let { schedule = defaultSchedule }: Props = $props();

	// Always ensure we have a schedule by using the default if schedule is empty
	const initialData = {
		schedule: schedule?.length ? schedule : defaultSchedule
	};

	const { form, enhance, delayed, errors } = superForm(
		defaults(initialData, zod(storeHoursSchema)),
		{
			validators: zodClient(storeHoursSchema),
			SPA: true,
			dataType: 'json',
			resetForm: false,
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
		}
	);

	// Simple helper function to find the index of a day in the form.schedule array
	function getDayIndex(dayName: string): number {
		return $form.schedule.findIndex((item) => item.day === dayName);
	}
</script>

<form method="POST" use:enhance class="space-y-6">
	{#if $form.schedule}
		{#each days as dayName}
			{#if $form.schedule.some((item) => item.day === dayName)}
				{@const dayIndex = getDayIndex(dayName)}
				{#if dayIndex >= 0}
					<div class="rounded-lg border p-4">
						<div class="flex items-center justify-between">
							<h3 class="text-lg font-medium">{dayName}</h3>
							<div class="flex items-center space-x-2">
								<Switch id="{dayName}-isOpen" bind:checked={$form.schedule[dayIndex].isOpen} />
								<label for="{dayName}-isOpen">
									{$form.schedule[dayIndex].isOpen ? 'Open' : 'Closed'}
								</label>
							</div>
						</div>

						{#if $form.schedule[dayIndex].isOpen}
							<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div class="space-y-2">
									<label for="{dayName}-openTime">Opening Time</label>
									<input
										type="time"
										id="{dayName}-openTime"
										bind:value={$form.schedule[dayIndex].openTime}
										class="w-full rounded-md border border-gray-300 px-3 py-2"
									/>
									{#if $errors.schedule?.[dayIndex]?.openTime}
										<p class="text-sm text-red-500">{$errors.schedule[dayIndex].openTime}</p>
									{/if}
								</div>

								<div class="space-y-2">
									<label for="{dayName}-closeTime">Closing Time</label>
									<input
										type="time"
										id="{dayName}-closeTime"
										bind:value={$form.schedule[dayIndex].closeTime}
										class="w-full rounded-md border border-gray-300 px-3 py-2"
									/>
									{#if $errors.schedule?.[dayIndex]?.closeTime}
										<p class="text-sm text-red-500">{$errors.schedule[dayIndex].closeTime}</p>
									{/if}
								</div>
							</div>
						{/if}
					</div>
				{/if}
			{/if}
		{/each}
	{/if}

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
