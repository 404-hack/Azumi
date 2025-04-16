<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Minus, Plus, Trash2 } from 'lucide-svelte';
	import { client } from '$lib/hc';
	import { formatCurrency } from '$lib/utils';
	import { crossfade, scale, fade } from 'svelte/transition';
	import { cubicOut, quintOut } from 'svelte/easing';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	interface CartItemProps {
		id: string;
		cartId: string;
		name: string;
		price: number;
		quantity: number;
		image?: string | null;
		specialInstructions?: string;
		onQuantityChange?: (newQuantity: number) => void;
		onRemove?: () => void;
	}

	let {
		id,
		cartId,
		name,
		price,
		quantity: initialQuantity,
		image = '',
		specialInstructions = '',
		onQuantityChange,
		onRemove
	} = $props<CartItemProps>();

	// Local state for optimistic updates
	let optimisticQuantity = $state(initialQuantity);
	let isUpdating = $state(false);
	let isRemoving = $state(false);
	let updateTimeout: NodeJS.Timeout;

	// Debounced update function
	async function debouncedUpdate(newQuantity: number) {
		clearTimeout(updateTimeout);

		const originalQuantity = optimisticQuantity;
		optimisticQuantity = newQuantity;

		updateTimeout = setTimeout(async () => {
			if (newQuantity === 0) {
				await handleRemove();
				return;
			}

			isUpdating = true;
			try {
				const response = await client.cart.items[':itemId'].$patch({
					param: { itemId: id },
					json: { quantity: newQuantity }
				});

				if (!response.ok) throw new Error('Failed to update quantity');

				onQuantityChange?.(newQuantity);
				await invalidateAll();
			} catch (error) {
				console.error('Error updating quantity:', error);
				optimisticQuantity = originalQuantity; // Revert on failure
				toast.error('Failed to update quantity');
			} finally {
				isUpdating = false;
			}
		}, 500); // 500ms debounce
	}

	async function handleRemove() {
		if (isRemoving) return;

		isRemoving = true;
		try {
			const response = await client.cart.items[':itemId'].$delete({
				param: { itemId: id }
			});

			if (!response.ok) throw new Error('Failed to remove item');

			onRemove?.();
			await invalidateAll();

			toast.success('Item removed from cart');
		} catch (error) {
			console.error('Error removing item:', error);
			toast.error('Failed to remove item');
		} finally {
			isRemoving = false;
		}
	}

	// Animation setup
	const [send, receive] = crossfade({
		duration: 200,
		easing: cubicOut,
		fallback: (node) => scale(node, { start: 0.95, opacity: 0, duration: 150 })
	});
</script>

<div
	class="relative flex items-center gap-4 overflow-hidden p-4"
	in:receive={{ key: id }}
	out:send={{ key: id }}
>
	<div class="relative">
		<img
			src={image || ''}
			alt={name}
			class="h-16 w-16 rounded-lg object-cover"
			transition:fade={{ duration: 200 }}
		/>
		{#if isUpdating}
			<div class="absolute inset-0 flex items-center justify-center rounded-lg bg-black/5">
				<div
					class="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
				/>
			</div>
		{/if}
	</div>

	<div class="min-w-0 flex-1">
		<h3 class="truncate text-base font-medium">{name}</h3>
		<p class="mt-1 text-sm text-gray-600">{formatCurrency(price)}</p>
		{#if specialInstructions}
			<p class="mt-1 text-xs italic text-gray-500">Note: {specialInstructions}</p>
		{/if}
	</div>

	<div class="flex items-center gap-2">
		<div
			class="flex items-center rounded-md border bg-background shadow-sm"
			class:opacity-50={isUpdating}
		>
			<Button
				variant="ghost"
				size="icon"
				class="h-8 w-8 rounded-r-none"
				disabled={isUpdating || optimisticQuantity <= 1}
				onclick={() => debouncedUpdate(optimisticQuantity - 1)}
			>
				<Minus class="h-3.5 w-3.5" />
			</Button>

			<div class="grid w-8 place-items-center border-x">
				<span class="text-sm font-medium">
					{optimisticQuantity}
				</span>
			</div>

			<Button
				variant="ghost"
				size="icon"
				class="h-8 w-8 rounded-l-none"
				disabled={isUpdating}
				onclick={() => debouncedUpdate(optimisticQuantity + 1)}
			>
				<Plus class="h-3.5 w-3.5" />
			</Button>
		</div>

		<Button
			variant="destructive"
			size="icon"
			class="h-8 w-8"
			disabled={isRemoving}
			onclick={handleRemove}
		>
			{#if isRemoving}
				<div
					class="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
				/>
			{:else}
				<Trash2 class="h-3.5 w-3.5" />
			{/if}
		</Button>
	</div>
</div>
