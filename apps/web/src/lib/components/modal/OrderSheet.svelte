<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import * as Sheet from '$lib/components/ui/sheet';
	import { formatCurrency } from '$lib/utils';
	import { ShoppingBasket } from 'lucide-svelte';
	// import OrderList from '../OrderList.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import { orderSheetStore } from '$lib/states/modalState.svelte';
</script>

<Sheet.Root bind:open={orderSheetStore.value}>
	<Sheet.Content class="overflow-y-auto rounded-s-lg p-2 pt-10 sm:max-w-md sm:p-4" side="right">
		<Sheet.Header>
			<Sheet.Title class="mb-5 text-3xl font-bold">Your Orders</Sheet.Title>
		</Sheet.Header>
		<Tabs.Root value="shoppingCart" class="w-full ">
			<Tabs.List class="grid w-full grid-cols-2">
				<Tabs.Trigger value="shoppingCart">Shopping Cart</Tabs.Trigger>
				<Tabs.Trigger value="orders">Orders</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="shoppingCart">
				<div class="flex flex-col gap-4">
					<div class="flex flex-col gap-2 rounded-lg border border-b p-2 py-4 shadow">
						<div class="flex items-center gap-4 border-b py-2">
							<img
								src="https://consumer-static-assets.wolt.com/frontpage-assets/hero-images/5_Friday.jpg"
								alt="Sushi"
								class="h-16 w-16 rounded-lg object-cover shadow"
							/>
							<div>
								<h3 class="text-sm font-medium">Amijami Sushi Kesklinn</h3>
								<p class="text-xs text-gray-600">Delivery in 30-40 min</p>
							</div>
							<span class="font-medium">{formatCurrency(133.0)}</span>
						</div>
						<div class="flex flex-col gap-2">
							<div class="flex items-center gap-2">
								<img
									src="https://consumer-static-assets.wolt.com/frontpage-assets/hero-images/5_Friday.jpg"
									alt="Sushi"
									class="size-12 rounded-lg object-cover shadow"
								/>
							</div>
						</div>

						<div class="flex justify-between gap-4">
							<Button variant="ghost" size="sm" class="flex-1">Add more items</Button>
							<Button variant="default" size="sm" class="flex-1">Go to checkout</Button>
						</div>
					</div>
				</div>
			</Tabs.Content>
			<Tabs.Content value="orders">Change your password here.</Tabs.Content>
		</Tabs.Root>
	</Sheet.Content>
</Sheet.Root>
