<script lang="ts">
	import type { TRiderTodo } from '@repo/types/index';
	import { CheckCircle2, Circle, Loader2, Clock } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Badge from '$lib/components/ui/badge';

	let { todos, onVerificationRequest, applicationStatus } = $props<{
		todos: { todo: TRiderTodo; profileCompletion: number };
		onVerificationRequest?: () => void;
		applicationStatus?: string;
	}>();

	let isLoading = $state(false);

	const taskItems = [
		{ field: 'personalInformationComplete', label: 'Complete personal information' },
		{ field: 'vehicleInformationComplete', label: 'Complete vehicle information' },
		{ field: 'paymentInformationComplete', label: 'Set up payment information' }
	];

	// Use the profileCompletion value directly from the backend
	const completionPercentage = $derived.by(() => {
		if (!todos) return 0;
		return todos.profileCompletion || 0;
	});
	const allTasksComplete = $derived.by(() => {
		if (!todos || !todos.todo) return false;
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
	{#if applicationStatus === 'PENDING'}
		<div class="rounded-md bg-yellow-50 p-4">
			<div class="flex">
				<div class="flex-shrink-0">
					<Clock class="h-5 w-5 text-yellow-500" />
				</div>
				<div class="ml-3">
					<div class="flex items-center">
						<h3 class="text-sm font-medium text-yellow-800">Application Pending</h3>
						<Badge.Root variant="outline" class="ml-2 border-yellow-400 text-yellow-600">
							PENDING
						</Badge.Root>
					</div>
					<div class="mt-2 text-sm text-yellow-700">
						Your verification request has been submitted and is being reviewed. You'll be notified
						when your application is approved.
					</div>
				</div>
			</div>
		</div>
	{:else if applicationStatus === 'APPROVED'}
		<div class="rounded-md bg-green-50 p-4">
			<div class="flex">
				<div class="flex-shrink-0">
					<CheckCircle2 class="h-5 w-5 text-green-500" />
				</div>
				<div class="ml-3">
					<div class="flex items-center">
						<h3 class="text-sm font-medium text-green-800">Application Approved</h3>
						<Badge.Root variant="outline" class="ml-2 border-green-400 text-green-600">
							APPROVED
						</Badge.Root>
					</div>
					<div class="mt-2 text-sm text-green-700">
						Congratulations! Your application has been approved. You can now start accepting
						delivery requests.
					</div>
				</div>
			</div>
		</div>
	{:else if allTasksComplete}
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
				{@const completed =
					todos && todos.todo ? todos.todo[item.field as keyof TRiderTodo] : false}
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
