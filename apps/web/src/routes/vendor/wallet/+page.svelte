<script lang="ts">
	import {
		Wallet,
		ArrowUpRight,
		ArrowDownLeft,
		History,
		Download,
		DollarSign,
		AlertCircle,
		Landmark
	} from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Progress } from '$lib/components/ui/progress';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { client } from '$lib/hc';

	// States
	let balance = $state(0);
	let pendingAmount = $state(0);
	let hasBankInfo = $state(false);
	let isLoading = $state(true);

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

	// Function to check if vendor has bank information
	async function checkBankInfo() {
		try {
			isLoading = true;
			// const response = await fetch('/api/vendor/payment-methods');
			const response = await client.vendor['payment-methods'].$get();
			const data = await response.json();
			console.log('🚀 ~ checkBankInfo ~ data:', data);

			// Check if the vendor has at least one payment method with bank details
			hasBankInfo = data.data.length > 0 ? true : false;

			// If bank info exists, also fetch wallet balance
			if (hasBankInfo) {
				await fetchWalletBalance();
			}
		} catch (error) {
			console.error('Error checking bank information:', error);
			hasBankInfo = false;
		} finally {
			isLoading = false;
		}
	}

	// Fetch wallet balance from API
	async function fetchWalletBalance() {
		try {
			const response = await client.vendor.wallet.$get();
			const data = await response.json();

			if (data.success) {
				balance = data.data.balance || 0;
				pendingAmount = data.data.pendingAmount || 0;
			}
		} catch (error) {
			console.error('Error fetching wallet balance:', error);
		}
	}

	// Navigate to bank account setup page
	function setupBankAccount() {
		goto('/vendor/banking?from=wallet');
	}

	onMount(() => {
		checkBankInfo();
	});
</script>

<div class="container mx-auto space-y-6 p-4">
	<h1 class="text-3xl font-bold">Wallet</h1>

	{#if isLoading}
		<div class="flex h-40 items-center justify-center">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
			></div>
		</div>
	{:else if !hasBankInfo}
		<!-- Bank Account Information Required -->
		<Card.Root class="mx-auto w-full max-w-2xl">
			<Card.Header>
				<Card.Title class="flex items-center text-amber-600">
					<AlertCircle class="mr-2 h-5 w-5" />
					Banking Information Required
				</Card.Title>
				<Card.Description>
					You need to set up your banking information before you can access your wallet and receive
					payments.
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="space-y-4">
					<p>
						To receive payments from your sales, we need your bank account details. Your earnings
						will be transferred to this account on a weekly basis.
					</p>
					<div class="flex flex-col space-y-2">
						<p class="font-medium">You'll need to provide:</p>
						<ul class="list-inside list-disc space-y-1 text-sm">
							<li>Bank name</li>
							<li>Account number</li>
						</ul>
					</div>
				</div>
			</Card.Content>
			<Card.Footer>
				<Button onclick={setupBankAccount} class="w-full">
					<Landmark class="mr-2 h-4 w-4" />
					Set Up Banking Information
				</Button>
			</Card.Footer>
		</Card.Root>
	{:else}
		<!-- Show Wallet if bank information is available -->
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
						<p class="text-xs text-muted-foreground mt-1">Payouts are processed automatically on a weekly basis.</p>
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
						<p class="text-sm text-muted-foreground">Scheduled for next weekly payout</p>
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
	{/if}
</div>
