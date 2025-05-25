<script lang="ts">
	import { onMount } from 'svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import * as Alert from '$lib/components/ui/alert';
	import { toast } from 'svelte-sonner';
	import {
		Loader2,
		CheckCircle2,
		AlertCircle,
		Trash2,
		CreditCard,
		Landmark,
		ArrowLeft
	} from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { client } from '$lib/hc';
	import { invalidateAll } from '$app/navigation';

	// Get data from loader
	let { data } = $props();

	// States
	let verifyingAccount = $state(false);
	let accountVerified = $state(false);
	let deletingPaymentMethod = $state(false);

	let accountNumber = $state('');
	let bankCode = $state('');
	let accountName = $state('');
	let savingAccount = $state(false);

	let paymentMethods = $state(data.paymentMethods || []);
	let banks = $state(data.banks || []);
	type Bank = {
		id: number;
		name: string;
		code: string;
	};

	type PaymentMethod = {
		id: string;
		type: string;
		accountNumber?: string;
		accountName?: string;
		bankName?: string;
		bankCode?: string;
		paystackRecipientCode?: string;
		isDefault: boolean;
		createdAt: string;
	};

	type VerifyAccountResponse = {
		success: boolean;
		data?: {
			accountName: string;
		};
		message?: string;
	};

	type SaveAccountResponse = {
		success?: boolean;
		message?: string;
		error?: string;
		data?: PaymentMethod;
	};

	// Format masked account number for display
	function formatMaskedAccount(accountNumber?: string): string {
		if (!accountNumber) return '';
		if (accountNumber.length <= 4) return accountNumber;

		const lastFour = accountNumber.slice(-4);
		const maskedPart = '*'.repeat(accountNumber.length - 4);
		return `${maskedPart}${lastFour}`;
	}
	// Delete payment method
	async function deletePaymentMethod(id: string) {
		try {
			if (confirm('Are you sure you want to delete this payment method?')) {
				deletingPaymentMethod = true;
				const response = await client.rider['payment-method'][':id'].$delete({ param: { id } });

				if (response.ok) {
					toast.success('Payment method deleted successfully');
					await invalidateAll();
					const freshData = await client.rider['payment-methods'].$get();
					const freshPaymentMethods = await freshData.json();
					if ('data' in freshPaymentMethods) {
						paymentMethods = freshPaymentMethods.data || [];
					}
				} else {
					const errorData = await response.json();
					const message =
						'message' in errorData
							? errorData.message
							: 'error' in errorData
								? errorData.error
								: 'Failed to delete payment method';
					toast.error(message);
				}
			}
		} catch (error) {
			console.error('Error deleting payment method:', error);
			toast.error('Failed to delete payment method');
		} finally {
			deletingPaymentMethod = false;
		}
	}

	// Verify bank account through Paystack
	async function verifyAccount() {
		if (!accountNumber || !bankCode) {
			toast.error('Please enter your account number and select a bank');
			return;
		}

		if (accountNumber.length !== 10) {
			toast.error('Account number must be 10 digits');
			return;
		}
		try {
			verifyingAccount = true;
			const response = await client.rider['verify-account'].$post({
				json: { accountNumber, bankCode }
			});

			const data = (await response.json()) as VerifyAccountResponse;

			if (data.success && data.data) {
				accountName = data.data.accountName;
				accountVerified = true;
				toast.success('Account verified successfully');
			} else {
				toast.error(data.message || 'Could not verify account');
			}
		} catch (error) {
			console.error('Error verifying account:', error);
			toast.error('Failed to verify account');
		} finally {
			verifyingAccount = false;
		}
	}

	// Save verified bank account details
	async function saveAccountDetails() {
		if (!accountVerified) {
			toast.error('Please verify your account first');
			return;
		}
		try {
			savingAccount = true;

			const bankName = banks.find((bank: Bank) => bank.code === bankCode)?.name || '';

			const response = await client.rider['payment-method'].$post({
				json: {
					type: 'BANK_TRANSFER',
					accountNumber,
					accountName,
					bankName,
					bankCode
				}
			});

			const data = (await response.json()) as SaveAccountResponse;

			if (data.success) {
				toast.success('Banking information saved successfully');
				// Refresh the payment methods
				await invalidateAll();
				const freshData = await client.rider['payment-methods'].$get();
				const freshPaymentMethods = await freshData.json();
				if ('data' in freshPaymentMethods) {
					paymentMethods = freshPaymentMethods.data || [];
				}

				resetForm();

				// Check if URL has a query string 'from', if it does redirect to that page
				const urlParams = new URLSearchParams(window.location.search);
				const from = urlParams.get('from');
				if (from) {
					setTimeout(() => {
						goto('/rider/' + from);
					}, 2000);
				}
			} else {
				const errorMessage = data.message || data.error || 'Failed to save banking information';
				toast.error(errorMessage);
			}
		} catch (error) {
			console.error('Error saving account details:', error);
			toast.error('Failed to save banking information');
		} finally {
			savingAccount = false;
		}
	}

	// Reset the form
	function resetForm() {
		accountNumber = '';
		bankCode = '';
		accountName = '';
		accountVerified = false;
	}
</script>

<div class="container mx-auto py-8">
	<div class="mb-6">
		<Button variant="ghost" class="mb-4 pl-0" onclick={() => goto('/rider/settings')}>
			<ArrowLeft class="mr-2 h-4 w-4" />
			Back to Settings
		</Button>
		<h1 class="text-3xl font-bold">Banking Information</h1>
		<p class="text-muted-foreground">
			Manage your bank account to receive payments from deliveries
		</p>
	</div>

	{#if paymentMethods.length > 0}
		<div class="mb-8">
			<h2 class="mb-4 text-xl font-semibold">Your Payment Methods</h2>

			{#each paymentMethods as method}
				<Card.Root class="mb-4 max-w-md">
					<Card.Header>
						<Card.Title class="flex items-center">
							{#if method.type === 'BANK_TRANSFER'}
								<Landmark class="mr-2 h-5 w-5" />
							{:else}
								<CreditCard class="mr-2 h-5 w-5" />
							{/if}
							{method.bankName || 'Bank Account'}
						</Card.Title>
						<Card.Description>
							{method.type === 'BANK_TRANSFER' ? 'Bank Account' : method.type}
						</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="space-y-2">
							{#if method.accountName}
								<p class="text-sm">
									<span class="font-medium">Account Name:</span>
									{method.accountName}
								</p>
							{/if}
							{#if method.accountNumber}
								<p class="text-sm">
									<span class="font-medium">Account Number:</span>
									{formatMaskedAccount(method.accountNumber)}
								</p>
							{/if}
						</div>
					</Card.Content>
					<Card.Footer>
						<Button
							variant="outline"
							size="sm"
							class="text-destructive hover:bg-destructive/10"
							onclick={() => deletePaymentMethod(method.id)}
							disabled={deletingPaymentMethod}
						>
							{#if deletingPaymentMethod}
								<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							{:else}
								<Trash2 class="mr-2 h-4 w-4" />
							{/if}
							Remove
						</Button>
					</Card.Footer>
				</Card.Root>
			{/each}
		</div>
	{/if}

	<!-- Add New Bank Account -->
	<Card.Root class="max-w-md">
		<Card.Header>
			<Card.Title>Add Bank Account</Card.Title>
			<Card.Description>Connect your bank account to receive payments</Card.Description>
		</Card.Header>
		<Card.Content>
			<form
				class="space-y-4"
				onsubmit={(e) => {
					e.preventDefault();
					if (accountVerified) {
						saveAccountDetails();
					} else {
						verifyAccount();
					}
				}}
			>
				<div class="space-y-2">
					<Label for="account-number">Account Number</Label>
					<Input
						id="account-number"
						placeholder="Enter your 10-digit account number"
						bind:value={accountNumber}
						disabled={accountVerified}
						maxlength={10}
						type="text"
						inputmode="numeric"
					/>
				</div>

				<div class="space-y-2">
					<Label for="bank-name">Bank Name</Label>
					<Select.Root type="single" bind:value={bankCode} disabled={accountVerified}>
						<Select.Trigger id="bank-name" class="w-full">
							{bankCode
								? banks.find((bank: Bank) => bank.code === bankCode)?.name
								: 'Select your bank'}
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								<Select.GroupHeading>Nigerian Banks</Select.GroupHeading>
								{#each banks as bank}
									<Select.Item value={bank.code}>{bank.name}</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</div>

				{#if accountVerified}
					<div class="space-y-2">
						<Label for="account-name">Account Name</Label>
						<div class="flex items-center gap-2">
							<Input id="account-name" value={accountName} disabled />
							<CheckCircle2 class="h-5 w-5 text-green-500" />
						</div>
						<p class="text-xs text-muted-foreground">Account verified with bank</p>
					</div>

					<Alert.Root variant="default" class="bg-primary/10">
						<Alert.Description class="text-xs">
							Your banking information is securely stored and used only for processing payments.
							Your details will never be shared with customers.
						</Alert.Description>
					</Alert.Root>
				{/if}

				<div class="pt-2">
					{#if !accountVerified}
						<Button type="submit" disabled={verifyingAccount || !accountNumber || !bankCode}>
							{#if verifyingAccount}
								<Loader2 class="mr-2 h-4 w-4 animate-spin" />
								Verifying...
							{:else}
								Verify Account
							{/if}
						</Button>
					{:else}
						<div class="flex gap-2">
							<Button variant="outline" type="button" onclick={resetForm}>Reset</Button>
							<Button type="submit" disabled={savingAccount}>
								{#if savingAccount}
									<Loader2 class="mr-2 h-4 w-4 animate-spin" />
									Saving...
								{:else}
									Save Bank Account
								{/if}
							</Button>
						</div>
					{/if}
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
