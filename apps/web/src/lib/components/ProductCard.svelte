<script lang="ts">
	import { Bell, Plus } from 'lucide-svelte';
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

	function notifyAvailability(e: Event) {
		e.stopPropagation();
		// This would typically connect to a notification system
		// For now, just show mock functionality
		alert('You will be notified when this item is back in stock');
	}
</script>

<button
	class={cn(
		'group flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent'
	)}
	onclick={openProductModal}
>
	<div class="relative aspect-square w-28 flex-shrink-0 overflow-hidden rounded-md">
		<img
			src={image || '/shop.avif'}
			alt={name}
			class="absolute inset-0 h-full w-full object-cover"
		/>
		{#if inStock === false}
			<div class="absolute inset-0 flex items-center justify-center bg-black/80">
				<span class="absolute right-1 top-1">
					<Bell
						onclick={notifyAvailability}
						class="h-5 w-5 cursor-pointer rounded-full bg-primary p-1 text-primary-foreground hover:bg-primary/90"
					/>
				</span>
			</div>
		{/if}
	</div>
	<div class="min-w-0 flex-1">
		<h3 class="text-sm font-medium capitalize">{name}</h3>
		<p class="mt-0.5 line-clamp-3 text-xs text-muted-foreground">
			{description}
		</p>
		<p class="mt-1 flex items-center gap-2 text-xs text-primary">
			{formatCurrency(price)}
			{#if inStock === false}
				<span class="text-xs font-medium text-red-500">Out of stock</span>
			{/if}
		</p>
	</div>
	<div class="flex-shrink-0">
		<div
			class={cn(
				'flex h-8 w-8 items-center justify-center rounded-full border transition-colors',
				inStock !== false
					? 'group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground'
					: 'opacity-50'
			)}
		>
			<Plus onclick={openProductModal} class="h-4 w-4" />
		</div>
	</div>
</button>
