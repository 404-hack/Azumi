<script lang="ts">
	import type { TRiderTodo } from '@repo/types/index';
	import { CheckCircle2, Circle, Loader2 } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';

	let { todos, onVerificationRequest } = $props<{
		todos: TRiderTodo;
		onVerificationRequest?: () => void;
	}>();

	let isLoading = $state(false);

	const taskItems = [
		{ field: 'personalInformationComplete', label: 'Complete personal information' },
		{ field: 'vehicleInformationComplete', label: 'Complete vehicle information' },
		{ field: 'paymentInformationComplete', label: 'Set up payment information' }
	];

	const completionPercentage = $derived.by(() => {
		const completedCount = taskItems.filter((item) => todos[item.field as keyof TRiderTodo]).length;
		return Math.round((completedCount / taskItems.length) * 100);
	});

	const allTasksComplete = $derived.by(() => {
		return completionPercentage === 100;
	});

	const handleVerificationRequest = async () => {
		if (isLoading || !onVerificationRequest) return;
		isLoading = true;
		try {
			await onVerificationRequest();
		} finally {
			isLoading = false;
		}
	};
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

	{#if allTasksComplete}
		<div class="rounded-md bg-green-50 p-4">
			<div class="flex">
				<div class="flex-shrink-0">
					<CheckCircle2 class="h-5 w-5 text-green-400" />
				</div>
				<div class="ml-3">
					<h3 class="text-sm font-medium text-green-800">All tasks completed!</h3>
					<div class="mt-2 text-sm text-green-700">
						You can now request verification to start receiving delivery orders.
					</div>
					<div class="mt-4">
						<Button
							onclick={handleVerificationRequest}
							disabled={isLoading}
							class="bg-green-600 hover:bg-green-500"
						>
							{#if isLoading}
								<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							{/if}
							Request Verification
						</Button>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<ul class="space-y-3">
			{#each taskItems as item}
				{@const completed = todos[item.field as keyof TRiderTodo]}
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
	{/if}
</div>
