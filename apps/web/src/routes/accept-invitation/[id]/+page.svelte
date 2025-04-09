<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import Button from '$lib/components/ui/button/button.svelte';
	import Alert from '$lib/components/ui/alert/alert.svelte';
	import { AlertTitle, AlertDescription } from '$lib/components/ui/alert';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription,
		CardFooter
	} from '$lib/components/ui/card';
	import { Loader2 } from 'lucide-svelte';

	let error = $state(null);
	let isLoading = $state(false);
	let isProcessing = $state(false);
	let isAccepted = $state(false);
	let session = $state(true);
	let { data } = $props();
	// Fetch invitation details

	// Accept invitation
	async function acceptInvitation() {
		try {
			isProcessing = true;

			if (!session) {
				// Redirect to sign in with return URL
				const returnUrl = encodeURIComponent(window.location.href);
				goto(`/sign-in?returnUrl=${returnUrl}`);
				return;
			}

			const { error: acceptError } = await authClient.organization.acceptInvitation({
				invitationId: data.invitation.id
			});

			if (acceptError) {
				throw new Error(acceptError.message || 'Failed to accept invitation');
			}

			isAccepted = true;
			// Redirect after a short delay
			setTimeout(() => {
				goto('/vendor/menu');
			}, 2000);
		} catch (err) {
			error = err.message || 'Failed to accept invitation';
		} finally {
			isProcessing = false;
		}
	}

	// Decline invitation
	async function declineInvitation() {
		try {
			isProcessing = true;

			if (!session) {
				// Redirect to sign in with return URL
				const returnUrl = encodeURIComponent(window.location.href);
				goto(`/sign-in?returnUrl=${returnUrl}`);
				return;
			}

			const { error: rejectError } = await authClient.organization.rejectInvitation({
				invitationId: data.invitation.id
			});

			if (rejectError) {
				throw new Error(rejectError.message || 'Failed to decline invitation');
			}

			// Redirect to home page
			goto('/');
		} catch (err) {
			error = err.message || 'Failed to decline invitation';
		} finally {
			isProcessing = false;
		}
	}
</script>

<svelte:head>
	<title>Accept Invitation | AZUMI</title>
</svelte:head>

<div class="container mx-auto flex min-h-[80vh] items-center justify-center px-4">
	{#if isLoading}
		<div class="flex flex-col items-center justify-center">
			<Loader2 class="h-10 w-10 animate-spin text-primary" />
			<p class="mt-4 text-muted-foreground">Loading invitation details...</p>
		</div>
	{:else if error}
		<Card class="w-full max-w-md">
			<CardHeader>
				<CardTitle class="text-xl">Invitation Error</CardTitle>
			</CardHeader>
			<CardContent>
				<Alert variant="destructive">
					<AlertTitle>Error</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
				<div class="mt-4 text-center">
					<Button variant="outline" onclick={() => goto('/')}>Return to Home</Button>
				</div>
			</CardContent>
		</Card>
	{:else if isAccepted}
		<Card class="w-full max-w-md">
			<CardHeader>
				<CardTitle class="text-center text-xl">Invitation Accepted!</CardTitle>
			</CardHeader>
			<CardContent>
				<Alert>
					<AlertDescription>
						You have successfully joined {data.invitation.organizationName}. Redirecting you to the
						dashboard...
					</AlertDescription>
				</Alert>
			</CardContent>
		</Card>
	{:else}
		<Card class="w-full max-w-md">
			<CardHeader>
				<CardTitle class="text-xl">Invitation</CardTitle>
				<CardDescription>
					You've been invited to join {data.invitation.organizationName}.
				</CardDescription>
			</CardHeader>
			<CardContent>
				You've been invited to join {data.invitation.organizationName}

				<div class="space-y-2">
					<div>
						<p class="text-sm font-medium">From</p>
						<p>{data.invitation.inviterEmail || 'Unknown'}</p>
					</div>
					<div>
						<p class="text-sm font-medium">Role</p>
						<p>
							{Array.isArray(data.invitation.role)
								? data.invitation.role.join(', ')
								: data.invitation.role || 'Member'}
						</p>
					</div>
					{#if data.invitation.expiresAt}
						<div>
							<p class="text-sm font-medium">Expires</p>
							<p>{new Date(data.invitation.expiresAt).toLocaleDateString()}</p>
						</div>
					{/if}

					{#if !session}
						<Alert class="mt-4">
							<AlertDescription>You need to sign in to accept this invitation.</AlertDescription>
						</Alert>
					{/if}
				</div>
			</CardContent>
			<CardFooter class="flex justify-between">
				<Button variant="outline" disabled={isProcessing} onclick={declineInvitation}>
					{session ? 'Decline' : 'Sign in to decline'}
				</Button>
				<Button
					variant={session ? 'default' : 'outline'}
					disabled={isProcessing}
					onclick={acceptInvitation}
				>
					{isProcessing ? 'Processing...' : session ? 'Accept Invitation' : 'Sign in to accept'}
				</Button>
			</CardFooter>
		</Card>
	{/if}
</div>
