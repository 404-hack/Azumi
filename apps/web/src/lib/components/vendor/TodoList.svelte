<script lang="ts">
	import { CheckCircle2, Circle } from 'lucide-svelte';

	const todos = [
		{ id: 1, task: 'Complete store information', completed: true },
		{ id: 2, task: 'Upload menu items', completed: true },
		{ id: 3, task: 'Set up payment method', completed: false },
		{ id: 4, task: 'Configure delivery zones', completed: false },
		{ id: 5, task: 'Review terms and conditions', completed: false }
	];
</script>

<ul class="space-y-3">
	{#each todos as todo (todo.id)}
		<li class="flex items-center space-x-3 rounded-md bg-muted p-3">
			{#if todo.completed}
				<CheckCircle2 class="h-5 w-5 text-primary" />
			{:else}
				<Circle class="h-5 w-5 text-muted-foreground" />
			{/if}
			<span class="text-sm {todo.completed ? 'text-muted-foreground line-through' : ''}"
				>{todo.task}</span
			>
		</li>
	{/each}
</ul>
