<script lang="ts">
	import type { TShopTodo } from '@repo/server/types';
	import { CheckCircle2, Circle } from 'lucide-svelte';

	let { todos } = $props<{ todos: TShopTodo }>();

	// Define the structured tasks based on the shopTodo database schema
	const taskItems = [
		{ field: 'storeInformationComplete', label: 'Complete store information' },
		{ field: 'uploadAtLeastOneMenu', label: 'Upload at least one menu' },
		{ field: 'setUpPaymentMethod', label: 'Set up payment method' },
		{ field: 'reviewTermsAndConditions', label: 'Review terms and conditions' },
		{ field: 'setUpOperatingHours', label: 'Set up operating hours' }
	];

	// Calculate profile completion percentage
	const completionPercentage = $derived.by(() => {
		const completedCount = taskItems.filter((item) => todos[item.field]).length;
		return Math.round((completedCount / taskItems.length) * 100);
	});
</script>

<div class="space-y-4">
	<div class="mb-4">
		<div class="mb-1 flex items-center justify-between">
			<span class="text-sm font-medium">Profile completion</span>
			<span class="text-sm font-medium">{completionPercentage}%</span>
		</div>
		<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
			<div
				class="h-full bg-primary transition-all duration-300"
				style="width: {completionPercentage}%"
			></div>
		</div>
	</div>

	<ul class="space-y-3">
		{#each taskItems as item}
			{@const completed = todos[item.field]}
			<li class="flex items-center space-x-3 rounded-md bg-muted p-3">
				{#if completed}
					<CheckCircle2 class="h-5 w-5 text-primary" />
				{:else}
					<Circle class="h-5 w-5 text-muted-foreground" />
				{/if}
				<span class="text-sm {completed ? 'text-muted-foreground line-through' : ''}"
					>{item.label}</span
				>
			</li>
		{/each}
	</ul>
</div>
