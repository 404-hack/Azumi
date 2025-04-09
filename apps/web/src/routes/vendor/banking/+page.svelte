<script lang="ts">
	import { onMount } from 'svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import * as Alert from '$lib/components/ui/alert';
	import { toast } from 'svelte-sonner';
	import { Loader2, CheckCircle2, AlertCircle, Trash2, CreditCard, Landmark } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { client } from '$lib/hc';

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
		name: string;
		accountNumber?: string;
		accountName?: string;
		bankName?: string;
		isDefault: boolean;
		additionalDetails?: string;
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
				const response = await client.vendor['payment-methods'][':id'].$delete({ param: { id } });

				if (response.ok) {
					toast.success('Payment method deleted successfully');
					paymentMethods = [];
				} else {
					const errorData = await response.json();
					toast.error(errorData.message || 'Failed to delete payment method');
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
			const response = await client.vendor['verify-account'].$post({
				json: { accountNumber, bankCode }
			});

			const data = await response.json();

			if (data.success) {
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

			const bankName = banks.find((bank) => bank.code === bankCode)?.name || '';

			const response = await client.vendor['payment-methods'].$post({
				json: {
					type: 'BANK_TRANSFER',
					name: 'Bank Account',
					accountNumber,
					accountName,
					bankName,
					bankCode,
					isDefault: true
				}
			});

			const data = await response.json();

			if (data.success) {
				toast.success('Banking information saved successfully');
				// Refresh the payment methods or redirect
				paymentMethods = [data.data];

				resetForm();
				// using svelte, check is the url has a query string 'from', if it does redirec to that page, if not do not redirect
				const urlParams = new URLSearchParams(window.location.search);
				const from = urlParams.get('from');
				if (from) {
					// ad a setTimeout of 2 seconds before redirecting
					setTimeout(() => {
						goto('/vendor/' + from);
					}, 2000);
				}
			} else {
				toast.error(data.message || 'Failed to save banking information');
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
		<h1 class="text-3xl font-bold">Banking Information</h1>
		<p class="text-muted-foreground">Manage your bank account to receive payments from orders</p>
	</div>

	{#if paymentMethods.length > 0}
		<div class="mb-8">
			<h2 class="mb-4 text-xl font-semibold">Your Payment Method</h2>

			{#each paymentMethods as method}
				<Card.Root class="max-w-md">
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
								<div>
									<span class="text-sm font-medium">Account Name:</span>
									<span class="ml-2 text-sm">{method.accountName}</span>
								</div>
							{/if}

							{#if method.accountNumber}
								<div>
									<span class="text-sm font-medium">Account Number:</span>
									<span class="ml-2 text-sm">{formatMaskedAccount(method.accountNumber)}</span>
								</div>
							{/if}

							{#if method.bankName}
								<div>
									<span class="text-sm font-medium">Bank:</span>
									<span class="ml-2 text-sm">{method.bankName}</span>
								</div>
							{/if}

							<div class="mt-4">
								<Alert.Root class="bg-muted/50">
									<AlertCircle class="h-4 w-4" />
									<Alert.Description>
										Your earnings will be transferred to this account on a weekly basis.
									</Alert.Description>
								</Alert.Root>
							</div>
						</div>
					</Card.Content>

					<Card.Footer>
						<Button
							variant="destructive"
							size="sm"
							class="w-full"
							onclick={() => deletePaymentMethod(method.id)}
							disabled={deletingPaymentMethod}
						>
							{#if deletingPaymentMethod}
								<Loader2 class="mr-2 h-4 w-4 animate-spin" />
								Deleting...
							{:else}
								<Trash2 class="mr-2 h-4 w-4" />
								Remove Payment Method
							{/if}
						</Button>
					</Card.Footer>
				</Card.Root>
			{/each}
		</div>
	{:else}
		<Card.Root class="mx-auto max-w-md">
			<Card.Header>
				<Card.Title>Add Bank Account</Card.Title>
				<Card.Description>
					Enter your bank account details to receive weekly payments from your sales
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="space-y-6">
					<div class="space-y-2">
						<Label for="bankCode">Bank</Label>
						<Select.Root
							type="single"
							bind:value={bankCode}
							disabled={verifyingAccount || accountVerified}
						>
							<Select.Trigger id="bankCode" class="w-full">
								{bankCode
									? data.banks.find((bank) => bank.code === bankCode)?.name
									: 'Select your bank'}
							</Select.Trigger>
							<Select.Content>
								<Select.Group>
									<Select.GroupHeading>Nigerian Banks</Select.GroupHeading>
									{#each data.banks as bank}
										<Select.Item value={bank.code}>{bank.name}</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
					</div>

					<div class="space-y-2">
						<Label for="accountNumber">Account Number</Label>
						<Input
							id="accountNumber"
							bind:value={accountNumber}
							placeholder="10-digit account number"
							type="text"
							inputmode="numeric"
							pattern="[0-9]*"
							maxlength={10}
							disabled={verifyingAccount || accountVerified}
						/>
					</div>

					{#if !accountVerified}
						<Button
							class="w-full"
							onclick={verifyAccount}
							disabled={verifyingAccount || !accountNumber || !bankCode}
							variant="default"
						>
							{#if verifyingAccount}
								<Loader2 class="mr-2 h-4 w-4 animate-spin" />
								Verifying...
							{:else}
								Verify Account
							{/if}
						</Button>
					{:else}
						<div class="rounded-lg border bg-muted/50 p-3">
							<div class="flex items-center space-x-3">
								<CheckCircle2 class="h-5 w-5 text-green-500" />
								<div>
									<p class="text-sm font-medium">Account Verified</p>
									<p class="text-xs text-muted-foreground">
										Your account details have been verified
									</p>
								</div>
							</div>
						</div>

						<div class="space-y-2">
							<Label for="accountName">Account Name</Label>
							<Input id="accountName" value={accountName} readonly disabled class="bg-muted/50" />
						</div>

						<div class="flex space-x-2">
							<Button variant="outline" onclick={resetForm} disabled={savingAccount} class="flex-1">
								Try Different Account
							</Button>

							<Button
								variant="default"
								onclick={saveAccountDetails}
								disabled={savingAccount}
								class="flex-1"
							>
								{#if savingAccount}
									<Loader2 class="mr-2 h-4 w-4 animate-spin" />
									Saving...
								{:else}
									Save Details
								{/if}
							</Button>
						</div>
					{/if}
				</div>
			</Card.Content>
			<Card.Footer class="block space-y-2 sm:flex">
				<div class="flex items-start space-x-2 text-sm text-muted-foreground">
					<AlertCircle class="mt-0.5 h-4 w-4 flex-shrink-0" />
					<p>
						Your banking information is securely stored and used only for processing payments. Your
						earnings will be transferred to this account on a weekly basis.
					</p>
				</div>
			</Card.Footer>
		</Card.Root>
	{/if}
</div>
