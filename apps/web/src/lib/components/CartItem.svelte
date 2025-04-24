<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Minus, Plus, Trash2 } from 'lucide-svelte';
	import { client } from '$lib/hc';
	import { formatCurrency } from '$lib/utils';
	import { crossfade, scale, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { onClickOutside } from 'runed';

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
		image = 'https://placehold.co/400x300?text=No+Image',
		specialInstructions = '',
		onQuantityChange,
		onRemove
	}: CartItemProps = $props();

	// Simplified state using a single status variable
	let optimisticQuantity = $state(initialQuantity);
	let status = $state<'idle' | 'updating' | 'removing'>('idle'); // 'idle', 'updating', 'removing'
	let updateTimeout: NodeJS.Timeout;

	// Debounced update function
	async function debouncedUpdate(newQuantity: number) {
		clearTimeout(updateTimeout);

		// Prevent updates if not idle or quantity is invalid
		if (status !== 'idle' || newQuantity < 1) {
			return; // Don't proceed if busy or quantity is zero/negative
		}

		const originalQuantity = optimisticQuantity;
		optimisticQuantity = newQuantity; // Optimistic UI update

		updateTimeout = setTimeout(async () => {
			// Set status to prevent concurrent operations during the actual network request
			status = 'updating';
			try {
				const response = await client.cart.items[':itemId'].$patch({
					param: { itemId: id },
					json: { quantity: newQuantity }
				});

				if (!response.ok) throw new Error('Failed to update quantity');

				onQuantityChange?.(newQuantity);
				await invalidateAll(); // Refresh data
				// Successful update, status reset in finally
			} catch (error) {
				console.error('Error updating quantity:', error);
				optimisticQuantity = originalQuantity; // Revert optimistic update on failure
				toast.error('Failed to update quantity');
				// Status reset in finally
			} finally {
				status = 'idle'; // Reset status after operation completes or fails
			}
		}, 500); // 500ms debounce
	}

	async function handleRemove() {
		if (status !== 'idle') return; // Don't remove if already busy

		// Set status to prevent concurrent operations
		status = 'removing';
		try {
			const response = await client.cart.items[':itemId'].$delete({
				param: { itemId: id }
			});

			if (!response.ok) throw new Error('Failed to remove item');

			onRemove?.(); // Notify parent
			await invalidateAll(); // Refresh data (might cause this component to unmount)
			toast.success('Item removed from cart');
			// If invalidateAll causes unmount, status reset might not run, which is okay.
		} catch (error) {
			console.error('Error removing item:', error);
			toast.error('Failed to remove item');
			status = 'idle'; // Reset status on error
		} finally {
			// Ensure status resets ONLY if it's still 'removing'
			// (covers cases where invalidateAll didn't unmount)
			if (status === 'removing') {
				status = 'idle';
			}
		}
	}

	// Animation setup
	const [send, receive] = crossfade({
		duration: 200,
		easing: cubicOut,
		fallback: (node) => scale(node, { start: 0.95, opacity: 0, duration: 150 })
	});

	let showControls = $state(false);

	function toggleControls() {
		showControls = !showControls;
	}

	// Handle clicks outside
	let controlsRef = $state<HTMLDivElement>();
	onClickOutside(
		() => controlsRef,
		() => {
			if (showControls) showControls = false;
		}
	);
</script>

<div
	class="relative flex items-center gap-4 overflow-hidden p-4"
	in:receive={{ key: id }}
	out:send={{ key: id }}
>
	<div class="relative">
		<img
			src={image || 'https://placehold.co/400x300?text=No+Image'}
			alt={name}
			transition:fade={{ duration: 200 }}
			class="h-16 w-16 rounded-lg object-cover object-center"
		/>
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
			class="flex h-8 items-center rounded-md border bg-background transition-all duration-200"
			class:w-8={!showControls}
			class:w-32={showControls}
			bind:this={controlsRef}
		>
			{#if showControls}
				<Button
					variant="ghost"
					size="icon"
					class="h-8 w-8 rounded-r-none"
					disabled={status !== 'idle' || optimisticQuantity <= 1}
					onclick={() => debouncedUpdate(optimisticQuantity - 1)}
				>
					<Minus class="h-3.5 w-3.5" />
				</Button>
			{/if}

			<button
				class="grid cursor-pointer place-items-center transition-all"
				class:w-8={!showControls}
				class:w-16={showControls}
				class:border-x={showControls}
				onclick={toggleControls}
			>
				<span class="text-sm font-medium" class:px-2={showControls}>
					{optimisticQuantity}
				</span>
			</button>

			{#if showControls}
				<Button
					variant="ghost"
					size="icon"
					class="h-8 w-8 rounded-l-none"
					disabled={status !== 'idle'}
					onclick={() => debouncedUpdate(optimisticQuantity + 1)}
				>
					<Plus class="h-3.5 w-3.5" />
				</Button>
			{/if}
		</div>

		<Button
			variant="destructive"
			size="icon"
			class="h-8 w-8"
			disabled={status !== 'idle'}
			onclick={handleRemove}
		>
			<Trash2 class="h-3.5 w-3.5" />
		</Button>
	</div>
</div>
