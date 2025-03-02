<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Minus, Plus, Trash2 } from 'lucide-svelte';
	import { cart } from '$lib/store/cartStore.svelte';
	import { formatCurrency } from '$lib/utils';

	export let id: string;
	export let name: string;
	export let price: number;
	export let quantity: number;
	export let image: string | undefined = undefined;
</script>

<div class="flex items-center gap-4 border-b py-4">
	{#if image}
		<img src={image} alt={name} class="h-16 w-16 rounded-lg object-cover" />
	{/if}

	<div class="flex-1">
		<h3 class="font-medium">{name}</h3>
		<p class="text-sm text-gray-600">{formatCurrency(price)}</p>
	</div>

	<div class="flex items-center gap-2">
		<Button
			variant="outline"
			size="icon"
			class="h-8 w-8"
			on:click={() => cart.updateQuantity(id, quantity - 1)}
		>
			<Minus class="h-4 w-4" />
		</Button>

		<span class="w-8 text-center">{quantity}</span>

		<Button
			variant="outline"
			size="icon"
			class="h-8 w-8"
			on:click={() => cart.updateQuantity(id, quantity + 1)}
		>
			<Plus class="h-4 w-4" />
		</Button>

		<Button
			variant="destructive"
			size="icon"
			class="ml-2 h-8 w-8"
			on:click={() => cart.removeItem(id)}
		>
			<Trash2 class="h-4 w-4" />
		</Button>
	</div>
</div>
