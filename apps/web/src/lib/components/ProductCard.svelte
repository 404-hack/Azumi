<script lang="ts">
	import { Plus } from 'lucide-svelte';
	import { cn, formatCurrency } from '$lib/utils';
	import { productModalState } from '$lib/states/modalState.svelte';
	import type { MenuItem } from '$lib/states/modalState.svelte';

	interface ProductCardProps extends MenuItem {
		category?: string;
	}

	let {
		description,
		image,
		name,
		price,
		id,
		categoryId,
		category,
		priceDescription,
		inStock,
		menuItemOptionGroups,
		packId,
		shopId,
		createdAt,
		updatedAt
	}: ProductCardProps = $props();

	function openProductModal(e: Event) {
		e.stopPropagation();
		productModalState.openWithProduct({
			id,
			name,
			description,
			image,
			price,
			categoryId,
			category,
			priceDescription,
			inStock,
			menuItemOptionGroups,
			packId,
			shopId,
			createdAt,
			updatedAt
		});
	}
</script>

<button
	class={cn(
		'group flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent'
	)}
	onclick={openProductModal}
>
	<div class="relative aspect-square w-20 flex-shrink-0 overflow-hidden rounded-md">
		<img
			src={image || '/shop.avif'}
			alt={name}
			class="absolute inset-0 h-full w-full object-cover"
		/>
	</div>
	<div class="min-w-0 flex-1">
		<h3 class="text-sm font-medium capitalize">{name}</h3>
		<p class="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
			{description}
		</p>
		<p class="mt-1 text-xs text-primary">
			{formatCurrency(price)}
		</p>
	</div>
	<div class="flex-shrink-0">
		<div
			class="flex h-8 w-8 items-center justify-center rounded-full border transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"
		>
			<Plus onclick={openProductModal} class="h-4 w-4" />
		</div>
	</div>
</button>
