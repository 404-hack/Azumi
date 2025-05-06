import { onMount } from 'svelte';
import { page } from '$app/stores';
import { goto } from '$app/navigation';
import { client } from '$lib/api/client'; // Assuming you have an API client instance
import * as Card from '$lib/components/ui/card';
import { Button } from '$lib/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-svelte';

let status: 'loading' | 'success' | 'failed' | 'error' = 'loading';
let message: string = 'Verifying your payment...';
let orderId: string | null = null;

onMount(async () => {
    const queryParams = $page.url.searchParams;
    const reference = queryParams.get('reference') || queryParams.get('trxref'); // Paystack might use trxref

    if (!reference) {
        status = 'error';
        message = 'Payment reference not found in URL. Please contact support if payment was made.';
        return;
    }

    try {
        // Call backend to verify payment status
        // We'll create this endpoint next: /orders/verify-payment/:reference
        const response = await client.orders['verify-payment'][reference].$get();

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Verification request failed');
        }

        const result = await response.json();

        orderId = result.data.orderId; // Get orderId from backend response

        switch (result.data.paymentStatus) {
            case 'COMPLETED':
                status = 'success';
                message = 'Your payment was successful! Your order is confirmed.';
                // Optional: Redirect to order details page after a delay
                // setTimeout(() => {
                //     if (orderId) {
                //         goto(`/orders/${orderId}`);
                //     } else {
                //         goto('/orders'); // Fallback
                //     }
                // }, 3000);
                break;
            case 'FAILED':
                status = 'failed';
                message = 'Your payment failed or was cancelled. Please try again.';
                break;
            case 'PENDING':
                status = 'loading'; // Or a specific 'pending' state
                message = 'Your payment is still processing. We will update you once confirmed.';
                // You might want to keep polling or rely on webhooks for final status
                break;
            default:
                status = 'error';
                message = `Unknown payment status received: ${result.data.paymentStatus}. Please contact support.`;
        }

    } catch (err: any) {
        console.error('Error verifying payment:', err);
        status = 'error';
        message = err.message || 'An error occurred while verifying your payment. Please contact support.';
    }
});

function goToOrders() {
    goto('/orders');
}

function tryAgain() {
    // Redirect back to checkout or cart - needs context like shopId or cartId
    // For simplicity, redirecting to home for now
    goto('/');
}
</script>

<div class="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center p-4">
    <Card.Root class="w-full max-w-md">
        <Card.Header class="text-center">
            <Card.Title class="text-2xl">Payment Status</Card.Title>
        </Card.Header>
        <Card.Content class="flex flex-col items-center space-y-4">
            {#if status === 'loading'}
                <Loader2 class="h-16 w-16 animate-spin text-blue-500" />
            {:else if status === 'success'}
                <CheckCircle class="h-16 w-16 text-green-500" />
            {:else if status === 'failed' || status === 'error'}
                <XCircle class="h-16 w-16 text-red-500" />
            {/if}

            <p class="text-center text-lg">{message}</p>

            {#if status === 'success'}
                <Button on:click={goToOrders}>View My Orders</Button>
            {:else if status === 'failed'}
                <!-- Need a way to get back to the specific checkout -->
                 <Button on:click={tryAgain} variant="outline">Try Again</Button>
                 <Button on:click={goToOrders} variant="secondary">View My Orders</Button>
            {:else if status === 'error'}
                 <Button on:click={goToOrders} variant="secondary">Go to My Orders</Button>
            {/if}
        </Card.Content>
    </Card.Root>
</div>
