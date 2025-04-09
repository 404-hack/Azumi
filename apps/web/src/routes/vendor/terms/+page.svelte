<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Alert from '$lib/components/ui/alert';
	import { toast } from 'svelte-sonner';
	import { client } from '$lib/hc';
	import { goto } from '$app/navigation';

	let termsAccepted = $state(false);
	let isLoading = $state(false);
	let alreadyAccepted = $state(false);
	// Check if user has already accepted terms
	onMount(async () => {
		try {
			// Using the specific check endpoint we created
			const response = await client.vendor['terms-agreement'].check.$get();
			const data = await response.json();

			// Only set as accepted if we get a successful response with hasAgreement=true
			if (data.success && data.hasAgreement) {
				alreadyAccepted = true;
			}
		} catch (error) {
			console.error('Error checking terms status:', error);
			toast.error('Connection Error', {
				description: 'Unable to verify your terms acceptance status.'
			});
		}
	});
	async function handleTermsResponse(accepted: boolean) {
		isLoading = true;

		try {
			// Call the terms-agreement endpoint with accepted status
			const response = await client.vendor['terms-agreement'].$post({
				json: {
					agreementType: 'VENDOR_TERMS',
					version: '1.0', // Using a fixed version
					accepted
				}
			});
			const data = await response.json();

			// Only proceed if the server confirms success
			if (data.success) {
				if (accepted) {
					// Show success message if terms were accepted
					toast.success('Terms Accepted', {
						description: 'You have successfully accepted the terms and conditions.'
					});

					// Redirect to dashboard after successful acceptance
					setTimeout(() => {
						goto('/vendor/dashboard');
					}, 1500);
				} else {
					// Show warning message if terms were declined
					toast.error('Terms Declined', {
						description:
							'You have declined the terms and conditions. Some features may be unavailable.'
					});
				}
			}
		} catch (error) {
			console.error('Error updating terms agreement:', error);
			toast.error('Failed to update terms agreement. Please try again.', {
				description: 'Unable to process your request at this time.'
			});
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Vendor Terms and Conditions | Azumi</title>
	<meta name="description" content="Terms and conditions for Azumi vendors" />
</svelte:head>

<div class="container mx-auto max-w-4xl px-4 py-8">
	<Card.Root>
		<Card.Content class="p-6">
			<h1 class="mb-6 text-2xl font-bold">Vendor Terms and Conditions</h1>

			{#if alreadyAccepted}
				<Alert.Root class="mb-6">
					<Alert.Description>
						<div class="flex items-center gap-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 text-green-500"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
									clip-rule="evenodd"
								/>
							</svg>
							<span>You have already accepted these terms and conditions.</span>
						</div>
					</Alert.Description>
				</Alert.Root>
			{/if}

			<div class="terms-container mb-6 max-h-96 overflow-y-auto rounded-lg border p-4">
				<h2 class="mb-4 text-xl font-semibold">1. Introduction</h2>
				<p class="mb-3">
					Welcome to Azumi. These Vendor Terms and Conditions ("Terms") govern your use of the
					platform as a vendor. By registering as a vendor, you agree to be bound by these Terms.
				</p>

				<h2 class="mb-4 mt-5 text-xl font-semibold">2. Vendor Registration</h2>
				<p class="mb-3">
					To register as a vendor, you must provide accurate and complete information. You are
					responsible for maintaining the security of your account credentials.
				</p>
				<p class="mb-3">
					We reserve the right to verify your details and reject or suspend any account that
					provides inaccurate information or violates these Terms.
				</p>

				<h2 class="mb-4 mt-5 text-xl font-semibold">3. Listing Products</h2>
				<p class="mb-3">
					You may list products that comply with all applicable laws and our platform policies.
					Products must be accurately described, including details about ingredients, preparation
					methods, and allergen information.
				</p>
				<p class="mb-3">
					You are solely responsible for setting your prices, managing inventory, and ensuring the
					quality of your products.
				</p>

				<h2 class="mb-4 mt-5 text-xl font-semibold">4. Order Fulfillment</h2>
				<p class="mb-3">
					You agree to fulfill all orders in a timely manner according to the specifications
					provided by customers. Failure to fulfill orders may result in penalties, including
					suspension from the platform.
				</p>

				<h2 class="mb-4 mt-5 text-xl font-semibold">5. Fees and Payments</h2>
				<p class="mb-3">
					We charge a commission on each sale as specified in your vendor agreement. Payments will
					be processed according to our payment schedule.
				</p>
				<p class="mb-3">All taxes related to your sales are your responsibility.</p>

				<h2 class="mb-4 mt-5 text-xl font-semibold">6. Intellectual Property</h2>
				<p class="mb-3">
					You grant us a non-exclusive license to use your name, logo, and product images for
					promotional purposes.
				</p>
				<p class="mb-3">
					You must not infringe on any third-party intellectual property rights in your listings.
				</p>

				<h2 class="mb-4 mt-5 text-xl font-semibold">7. Termination</h2>
				<p class="mb-3">
					Either party may terminate this agreement with notice. Upon termination, outstanding
					orders must still be fulfilled, and any outstanding payments will be processed.
				</p>

				<h2 class="mb-4 mt-5 text-xl font-semibold">8. Limitation of Liability</h2>
				<p class="mb-3">
					Our platform is provided "as is" without warranties of any kind. We are not liable for
					indirect, incidental, special, or consequential damages.
				</p>

				<h2 class="mb-4 mt-5 text-xl font-semibold">9. Indemnification</h2>
				<p class="mb-3">
					You agree to indemnify and hold harmless Azumi from any claims arising from your products,
					listings, or violations of these Terms.
				</p>

				<h2 class="mb-4 mt-5 text-xl font-semibold">10. Governing Law</h2>
				<p class="mb-3">
					These Terms are governed by the laws of the jurisdiction specified in your vendor
					agreement.
				</p>

				<h2 class="mb-4 mt-5 text-xl font-semibold">11. Modifications</h2>
				<p class="mb-3">
					We reserve the right to modify these Terms at any time. Continued use of the platform
					after any changes constitutes acceptance of the revised Terms.
				</p>
			</div>

			{#if !alreadyAccepted}
				<div class="flex flex-col justify-end gap-4 sm:flex-row">
					<Button variant="outline" onclick={() => handleTermsResponse(false)} disabled={isLoading}>
						{isLoading ? 'Processing...' : 'Decline'}
					</Button>
					<Button onclick={() => handleTermsResponse(true)} disabled={isLoading}>
						{isLoading ? 'Processing...' : 'Accept Terms & Conditions'}
					</Button>
				</div>
			{:else}
				<div class="flex justify-end">
					<Button href="/vendor/dashboard">Return to Dashboard</Button>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>

<!-- <style lang="postcss">
	.terms-container {
		@apply prose prose-slate dark:prose-invert max-w-none;
	}
</style> -->
