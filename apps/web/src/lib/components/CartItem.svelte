<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Minus, Plus, Trash2 } from 'lucide-svelte';
	import { cart } from '$lib/store/cartStore.svelte';
	import { formatCurrency } from '$lib/utils';
	import { crossfade, scale } from 'svelte/transition';
	import { cubicOut, quintOut } from 'svelte/easing';

	interface CartItemProps {
		id: string;
		name: string;
		price: number;
		quantity: number;
		image?: string;
	}

	let { id, name, price, quantity, image = undefined }: CartItemProps = $props();

	let showControls = $state(false) ;
	let controlsContainer: HTMLDivElement;

	function toggleControls(show: boolean) {
		showControls = show;
	}

	function handleClickOutside(event: MouseEvent) {
		if (controlsContainer && !controlsContainer.contains(event.target as Node) && showControls) {
			// Add small delay before closing to make the transition feel more deliberate
			setTimeout(() => {
				toggleControls(false);
			}, 100);
		}
	}

	// Add wrapper functions to handle stopPropagation
	function handleDecrement(event: Event) {
		event.stopPropagation();
		cart.updateQuantity(id, quantity - 1);
	}

	function handleIncrement(event: Event) {
		event.stopPropagation();
		cart.updateQuantity(id, quantity + 1);
	}

	function handleRemove(event: Event) {
		event.stopPropagation();
		cart.removeItem(id);
	}

	$effect(() => {
		if (showControls) {
			document.addEventListener('click', handleClickOutside);
		} else {
			document.removeEventListener('click', handleClickOutside);
		}

		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	// Create crossfade transition with improved timing
	const [send, receive] = crossfade({
		duration: 200, // slightly shorter for better responsiveness
		easing: cubicOut,
		fallback(node) {
			return scale(node, { 
				start: 0.92, 
				opacity: 0, 
				duration: 150,
				easing: quintOut 
			});
		}
	});
</script>

<div class="flex items-center gap-4 border-b py-4 relative overflow-hidden">
	{#if image}
		<img src={image} alt={name} class="h-16 w-16 rounded-lg object-cover" />
	{/if}

	<div class="flex-1 min-w-0">
		<h3 class="font-medium text-base truncate">{name}</h3>
		<p class="text-sm text-gray-600 mt-1">{formatCurrency(price)}</p>
	</div>

	<div class="relative h-8 w-[120px] flex justify-end" bind:this={controlsContainer}>
		<!-- Quantity Button (when controls are hidden) -->
		{#if !showControls}
			<button 
				onclick={() => toggleControls(true)}
				class="h-8 min-w-[40px] px-2 rounded-md bg-muted hover:bg-muted/80 font-medium text-sm transition-all"
				in:receive={{ key: 'quantity', duration: 180 }}
				out:send={{ key: 'quantity', duration: 180 }}
			>
				{quantity}
			</button>
		{:else}
			<!-- Action Controls (when visible) -->
			<div 
				class="flex items-center rounded-md border bg-background shadow-sm"
				in:scale={{ 
					start: 0.95, 
					opacity: 0, 
					duration: 180, // slightly faster
					easing: quintOut 
				}}
				out:scale={{ 
					opacity: 0, 
					duration: 150, // quicker close transition
					easing: cubicOut
				}}
			>
				<Button
					variant="ghost"
					size="icon"
					class="h-8 w-8 rounded-r-none"
					onclick={handleDecrement}
				>
					<Minus class="h-3.5 w-3.5" />
				</Button>

				<div class="w-8 grid place-items-center border-x">
					<span 
						class="text-sm font-medium"
						in:receive={{ key: 'quantity', duration: 180 }}
						out:send={{ key: 'quantity', duration: 180 }}
					>
						{quantity}
					</span>
				</div>

				<Button
					variant="ghost"
					size="icon"
					class="h-8 w-8 rounded-l-none"
					onclick={handleIncrement}
				>
					<Plus class="h-3.5 w-3.5" />
				</Button>
				
				<Button
					variant="destructive"
					size="icon"
					class="ml-2 h-8 w-8"
					onclick={handleRemove}
				>
					<Trash2 class="h-3.5 w-3.5" />
				</Button>
			</div>
		{/if}
	</div>
</div>
