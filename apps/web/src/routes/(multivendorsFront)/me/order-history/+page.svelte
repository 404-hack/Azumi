<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import Button from '$lib/components/ui/button/button.svelte';
	import { ChevronsUpDown, Star } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { cn, formatCurrency } from '$lib/utils';
	import { Badge } from '$lib/components/ui/badge';

	const invoices = [
		{
			name: 'bugger and fries',
			price: '400',
			status: 'shipped'
		},
		{
			name: 'bugger and fries',
			price: '400',
			status: 'shipped'
		}
	];

	// You can toggle this to test both conditions
	$: orderList = $page.data.user?.activeCustomer?.orders.items;
</script>

{#if orderList && orderList.length > 0}
	{#each orderList as { code, orderPlacedAt, currencyCode, subTotalWithTax, state, lines }}
		<Collapsible.Root class=" mb-2">
			<div class="flex items-center bg-muted rounded-md p-5 justify-between">
				<div class="flex flex-wrap items-center justify-between gap-3 md:gap-10">
					<div class="">
						<p class="font-medium text-sm capitalize">Date placed</p>
						<p class="text-muted-foreground text-xs">
							{new Intl.DateTimeFormat('en-US', {
								year: 'numeric',
								month: 'short',
								day: '2-digit'
							}).format(new Date(orderPlacedAt))}
						</p>
					</div>
					<div>
						<p class="font-medium text-sm capitalize">Total sum</p>
						<p class="text-muted-foreground text-xs">
							{formatCurrency(Number(subTotalWithTax), currencyCode)}
						</p>
					</div>
					<div>
						<p class="font-medium text-sm capitalize">Order number</p>
						<p class="text-muted-foreground text-xs">{code}</p>
					</div>
					<div class="">
						<p class="font-medium text-sm capitalize">Status</p>
						<span
							class={cn(
								'inline-flex  items-center justify-center px-2 py-1 text-xs font-medium  rounded-full border',
								{
									'bg-yellow-100 text-yellow-800 border-yellow-200': [
										'Created',
										'Draft',
										'AddingItems',
										'ArrangingPayment',
										'Modifying'
									].includes(state),
									'bg-red-100 text-red-800 border-red-200': state === 'Cancelled',
									'bg-green-100 text-green-800 border-green-200': [
										'PaymentAuthorized',
										'PaymentSettled',
										'PartiallyShipped',
										'Shipped',
										'PartiallyDelivered',
										'Delivered'
									].includes(state),
									'bg-gray-100 text-gray-800 border-gray-200': state === 'Unknown'
								}
							)}
						>
							{#if ['Created', 'Draft'].includes(state)}
								{state}
							{:else if ['AddingItems', 'ArrangingPayment', 'Modifying'].includes(state)}
								{state.replace(/([A-Z])/g, ' $1').trim()}
							{:else if state === 'Cancelled'}
								Cancelled
							{:else if ['PaymentAuthorized', 'PaymentSettled'].includes(state)}
								{state.replace(/([A-Z])/g, ' $1').trim()}
							{:else if ['PartiallyShipped', 'Shipped', 'PartiallyDelivered', 'Delivered'].includes(state)}
								{state.replace(/([A-Z])/g, ' $1').trim()}
							{:else}
								Unknown
							{/if}
						</span>
					</div>
				</div>
				<Collapsible.Trigger asChild let:builder>
					<Button builders={[builder]} variant="ghost" size="sm" class="w-9 p-0">
						<ChevronsUpDown class="h-4 w-4" />
						<span class="sr-only">Toggle</span>
					</Button>
				</Collapsible.Trigger>
			</div>
			<Collapsible.Content class="space-y-2 p-0 m-0">
				<Table.Root class="border rounded-md">
					<!-- <Table.Caption>A list of your recent invoices.</Table.Caption> -->
					<Table.Header>
						<Table.Row class="text-sm">
							<Table.Head class="w-[100px]"></Table.Head>
							<Table.Head>Name</Table.Head>
							<Table.Head>sku</Table.Head>
							<Table.Head>Unit Price</Table.Head>
							<Table.Head>Quantity</Table.Head>
							<Table.Head class="text-right">Total</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body class="text-xs">
						{#each lines as { featuredAsset, quantity, linePriceWithTax, productVariant, id }}
							<Table.Row>
								<Table.Cell class="font-medium">
									<img src={featuredAsset?.preview} class="size-16 rounded-lg" alt="" />
								</Table.Cell>
								<Table.Cell class="capitalize">{productVariant.name}</Table.Cell>
								<Table.Cell class="capitalize">{productVariant.sku}</Table.Cell>
								<Table.Cell
									>{formatCurrency(Number(productVariant.priceWithTax), currencyCode)}</Table.Cell
								>
								<Table.Cell>{quantity}</Table.Cell>
								<Table.Cell class="text-right"
									>{formatCurrency(Number(linePriceWithTax), currencyCode)}</Table.Cell
								>
								{#if state === 'Delivered'}
									<Table.Cell class="">
										<Badge href="/review/{productVariant.productId}">
											Add a review <Star class="ml-2 size-4" />
										</Badge>
									</Table.Cell>
								{/if}
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Collapsible.Content>
		</Collapsible.Root>
	{/each}
{:else}
	<div class="h-[50vh] w-full flex flex-col text-center items-center justify-center">
		<h1 class="text-3xl font-display font-semibold">You haven't made any orders yet</h1>
		<p class="text-muted-foreground">You'll find all the details of your orders here</p>
	</div>
{/if}
