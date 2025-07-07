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
	let totalEarnings = $state(0);
	let totalWithdrawals = $state(0);
	let hasBankInfo = $state(false);
	let isLoading = $state(true);
	let transactions = $state([]);

	// Function to check if vendor has bank information
	async function checkBankInfo() {
		try {
			isLoading = true;
			const response = await client.vendor['payment-methods'].$get();
			const data = await response.json();
			console.log('🚀 ~ checkBankInfo ~ data:', data);

			// Check if the vendor has at least one payment method with bank details
			hasBankInfo = data.data.length > 0 ? true : false;

			// If bank info exists, also fetch wallet balance
			if (hasBankInfo) {
				await fetchWalletBalance();
				await fetchTransactionHistory();
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
				totalEarnings = data.data.totalEarnings || 0;
				totalWithdrawals = data.data.totalWithdrawals || 0;
			}
		} catch (error) {
			console.error('Error fetching wallet balance:', error);
		}
	} // Fetch transaction history from API
	async function fetchTransactionHistory() {
		try {
			const response = await client.vendor.transactions.$get();
			const data = await response.json();

			if (data.success) {
				transactions = data.data.map((transaction) => ({
					id: transaction.id,
					type: transaction.type.toLowerCase() === 'credit' ? 'credit' : 'debit',
					amount: transaction.amount,
					description: transaction.description || `Transaction ${transaction.reference}`,
					date: new Date(transaction.createdAt).toLocaleDateString(),
					status: transaction.status.toLowerCase(),
					orderId: transaction.orderId,
					reference: transaction.reference
				}));
			}
		} catch (error) {
			console.error('Error fetching transaction history:', error);
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

<div class="container mx-auto max-w-5xl space-y-8 p-4">
	<h1 class="mb-4 text-3xl font-bold">Wallet</h1>
	<div class="grid gap-6 md:grid-cols-3">
		<!-- Available Balance Card -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-lg">
					<Wallet class="h-5 w-5" /> Available Balance
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<p class="text-primary mb-1 text-4xl font-extrabold">₦{balance.toFixed(2)}</p>
				<p class="text-muted-foreground text-sm">Available for withdrawal</p>
				<p class="text-muted-foreground mt-2 text-xs">
					Payouts are processed automatically on a weekly basis.
				</p>
			</Card.Content>
		</Card.Root>
		<!-- Total Earnings Card -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-lg">
					<DollarSign class="h-5 w-5" /> Total Earnings
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<p class="mb-1 text-4xl font-extrabold text-green-700">₦{totalEarnings.toFixed(2)}</p>
				<p class="text-muted-foreground text-sm">All-time earnings</p>
			</Card.Content>
		</Card.Root>
		<!-- Pending Amount Card -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-lg">
					<History class="h-5 w-5" /> Pending Amount
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<p class="mb-1 text-4xl font-extrabold text-yellow-600">₦{pendingAmount.toFixed(2)}</p>
				<p class="text-muted-foreground text-sm">Scheduled for next weekly payout</p>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Transaction History -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-lg">Transaction History</Card.Title>
			<Card.Description>Your recent financial activities</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if transactions.length === 0}
				<div class="flex flex-col items-center py-8">
					<History class="text-muted-foreground mb-2 h-10 w-10" />
					<p class="text-muted-foreground">No transactions yet.</p>
				</div>
			{:else}
				<div class="divide-y">
					{#each transactions as transaction, i}
						<div class="flex items-center justify-between py-4 {i % 2 === 0 ? 'bg-gray-50' : ''}">
							<div class="flex items-center gap-4">
								{#if transaction.type === 'credit'}
									<ArrowDownLeft class="h-5 w-5 text-green-600" />
								{:else}
									<ArrowUpRight class="h-5 w-5 text-red-600" />
								{/if}
								<div>
									<p class="font-medium">{transaction.description}</p>
									<p class="text-muted-foreground text-xs">{transaction.date}</p>
								</div>
							</div>
							<div class="text-right">
								<p
									class="font-bold {transaction.type === 'credit'
										? 'text-green-600'
										: 'text-red-600'}"
								>
									{transaction.type === 'credit' ? '+' : '-'}₦{transaction.amount.toFixed(2)}
								</p>
								<p class="text-muted-foreground text-xs capitalize">{transaction.status}</p>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
