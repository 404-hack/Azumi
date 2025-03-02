<script lang="ts">
	import { Plus } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import { productModalState } from '$lib/states/modalState.svelte';

	interface ProductCardProps {
		id: string;
		name: string;
		description: string;
		image: string;
		price: number;
	}

	let { description, image, name, price, id }: ProductCardProps = $props();
</script>

<button
	class={cn(
		'group flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent'
	)}
>
	<div class="relative aspect-square w-20 flex-shrink-0 overflow-hidden rounded-md">
		<img
			src={image || '/placeholder.svg'}
			alt={name}
			class="absolute inset-0 h-full w-full object-cover"
		/>
	</div>
	<div class="min-w-0 flex-1">
		<h3 class="text-sm font-medium">{name}</h3>
		<p class="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
			{description}
		</p>
		<p class="mt-1 p-2 text-sm">${price.toFixed(2)}</p>
	</div>
	<div class="flex-shrink-0">
		<div
			class="flex h-8 w-8 items-center justify-center rounded-full border transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"
		>
			<Plus onclick={() => productModalState.setTrue()} class="h-4 w-4" />
		</div>
	</div>
</button>
