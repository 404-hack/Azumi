<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';

	interface MenuItemCardProps {
		id: string;
		name: string;
		price: number;
		description: string;
	}

	let { id, name, price, description }: MenuItemCardProps = $props();

	let quantity = $state(0);

	function handleAddToCart() {
		quantity++;
	}
</script>

<Card.Root>
	<Card.Content class="p-4">
		<h3 class="text-lg font-semibold">{name}</h3>
		<p class="mt-1 text-gray-600">{description}</p>
		<div class="mt-4 flex items-center justify-between">
			<span class="font-bold">${price.toFixed(2)}</span>
			{#if quantity === 0}
				<Button onclick={handleAddToCart}>Add to cart</Button>
			{:else}
				<div class="flex items-center">
					<Button variant="outline" size="sm" onclick={() => (quantity = Math.max(0, quantity - 1))}
						>-</Button
					>
					<span class="mx-2">{quantity}</span>
					<Button variant="outline" size="sm" onclick={() => quantity++}>+</Button>
				</div>
			{/if}
		</div>
	</Card.Content>
</Card.Root>
