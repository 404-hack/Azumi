<script lang="ts">
	import {
		Wallet,
		ArrowUpRight,
		ArrowDownLeft,
		History,
		Download,
		DollarSign
	} from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Progress } from '$lib/components/ui/progress';

	let balance = $state(5234.5);
	let pendingAmount = $state(1250.75);

	const transactions = [
		{
			id: 1,
			type: 'credit',
			amount: 234.5,
			description: 'Order #1234',
			date: '2024-01-30',
			status: 'completed'
		},
		{
			id: 2,
			type: 'debit',
			amount: 1500.0,
			description: 'Withdrawal to Bank Account',
			date: '2024-01-29',
			status: 'completed'
		},
		{
			id: 3,
			type: 'credit',
			amount: 345.75,
			description: 'Order #1235',
			date: '2024-01-28',
			status: 'completed'
		}
	];
</script>

<div class="container mx-auto space-y-6 p-4">
	<h1 class="text-3xl font-bold">Wallet</h1>

	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
		<!-- Balance Card -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center">
					<Wallet class="mr-2 h-5 w-5" />
					Available Balance
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="mt-2">
					<p class="text-3xl font-bold">${balance.toFixed(2)}</p>
					<p class="text-sm text-muted-foreground">Available for withdrawal</p>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Pending Amount Card -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center">
					<History class="mr-2 h-5 w-5" />
					Pending Amount
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="mt-2">
					<p class="text-3xl font-bold">${pendingAmount.toFixed(2)}</p>
					<p class="text-sm text-muted-foreground">Will be available in 2-3 business days</p>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Quick Actions Card -->
		<Card.Root class="md:col-span-2 lg:col-span-1">
			<Card.Header>
				<Card.Title class="flex items-center">
					<DollarSign class="mr-2 h-5 w-5" />
					Quick Actions
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="grid gap-4">
					<Button variant="outline" class="w-full justify-start">
						<ArrowUpRight class="mr-2 h-4 w-4" />
						Withdraw Funds
					</Button>
					<Button variant="outline" class="w-full justify-start">
						<Download class="mr-2 h-4 w-4" />
						Download Statement
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Transaction History -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Transaction History</Card.Title>
			<Card.Description>Your recent financial activities</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="space-y-4">
				{#each transactions as transaction}
					<div class="flex items-center justify-between rounded-lg border p-4">
						<div class="flex items-center space-x-4">
							{#if transaction.type === 'credit'}
								<div class="rounded-full bg-green-100 p-2">
									<ArrowDownLeft class="h-4 w-4 text-green-600" />
								</div>
							{:else}
								<div class="rounded-full bg-red-100 p-2">
									<ArrowUpRight class="h-4 w-4 text-red-600" />
								</div>
							{/if}
							<div>
								<p class="font-medium">{transaction.description}</p>
								<p class="text-sm text-muted-foreground">{transaction.date}</p>
							</div>
						</div>
						<div class="text-right">
							<p
								class="font-medium {transaction.type === 'credit'
									? 'text-green-600'
									: 'text-red-600'}"
							>
								{transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
							</p>
							<p class="text-sm capitalize text-muted-foreground">{transaction.status}</p>
						</div>
					</div>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>
</div>
