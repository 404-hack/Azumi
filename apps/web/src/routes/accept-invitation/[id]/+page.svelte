<!-- <script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth/auth-client';
	import Button from '$lib/components/ui/button/button.svelte';
	import Alert from '$lib/components/ui/alert/alert.svelte';
	import { AlertTitle, AlertDescription } from '$lib/components/ui/alert';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '$lib/components/ui/card';
	import { Loader2 } from 'lucide-svelte';

	// State using Svelte 5 runes
	let token = $state('');
	let invitation = $state(null);
	let error = $state(null);
	let isLoading = $state(true);
	let isProcessing = $state(false);
	let isAccepted = $state(false);
	let session = $state(null);

	// Get session information
	$effect(() => {
		if (browser) {
			checkSession();
		}
	});

	// Get the token from URL and fetch invitation details
	$effect(() => {
		if (browser) {
			const urlParams = new URLSearchParams(window.location.search);
			token = urlParams.get('token') || '';
			if (token) {
				fetchInvitationDetails();
			} else {
				error = 'Invalid invitation link. No token provided.';
				isLoading = false;
			}
		}
	});

	// Check if user is logged in
	async function checkSession() {
		try {
			const { data } = await authClient.getSession();
			session = data;
		} catch (err) {
			console.error('Error checking session:', err);
		}
	}

	// Fetch invitation details
	async function fetchInvitationDetails() {
		try {
			isLoading = true;
			
			const { data, error: invitationError } = await authClient.organization.getInvitation({
				query: {
					id: token
				}
			});
			
			if (invitationError) {
				throw new Error(invitationError.message || 'Failed to validate invitation');
			}

			invitation = data;
			isLoading = false;
		} catch (err) {
			console.error('Error fetching invitation details:', err);
			error = err.message || 'The invitation is invalid or has expired.';
			isLoading = false;
		}
	}

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
				invitationId: token
			});

			if (acceptError) {
				throw new Error(acceptError.message || 'Failed to accept invitation');
			}

			isAccepted = true;
			// Redirect after a short delay
			setTimeout(() => {
				goto('/dashboard');
			}, 2000);
		} catch (err) {
			console.error('Error accepting invitation:', err);
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
				invitationId: token
			});

			if (rejectError) {
				throw new Error(rejectError.message || 'Failed to decline invitation');
			}

			// Redirect to home page
			goto('/');
		} catch (err) {
			console.error('Error declining invitation:', err);
			error = err.message || 'Failed to decline invitation';
		} finally {
			isProcessing = false;
		}
	}
</script>

<svelte:head>
	<title>Accept Invitation | African Market</title>
</svelte:head>

<div class="container mx-auto flex items-center justify-center min-h-[80vh] px-4">
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
					<Button variant="outline" on:click={() => goto('/')}>Return to Home</Button>
				</div>
			</CardContent>
		</Card>
	{:else if isAccepted}
		<Card class="w-full max-w-md">
			<CardHeader>
				<CardTitle class="text-xl text-center">Invitation Accepted!</CardTitle>
			</CardHeader>
			<CardContent>
				<Alert>
					<AlertDescription>
						You have successfully joined {invitation?.organization?.name || 'the organization'}. Redirecting you to the dashboard...
					</AlertDescription>
				</Alert>
			</CardContent>
		</Card>
	{:else if invitation}
		<Card class="w-full max-w-md">
			<CardHeader>
				<CardTitle class="text-xl">Invitation</CardTitle>
				<CardDescription>
					You've been invited to join {invitation.organization?.name || 'an organization'}.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{#if invitation.message}
					<div class="bg-muted p-4 rounded-md mb-4">
						<p class="text-sm italic">"{invitation.message}"</p>
					</div>
				{/if}
				<div class="space-y-2">
					<div>
						<p class="text-sm font-medium">From</p>
						<p>{invitation.inviter?.name || 'Unknown'}</p>
					</div>
					<div>
						<p class="text-sm font-medium">Role</p>
						<p>{Array.isArray(invitation.role) ? invitation.role.join(', ') : invitation.role || 'Member'}</p>
					</div>
					{#if invitation.expiresAt}
						<div>
							<p class="text-sm font-medium">Expires</p>
							<p>{new Date(invitation.expiresAt).toLocaleDateString()}</p>
						</div>
					{/if}
					
					{#if !session}
						<Alert class="mt-4">
							<AlertDescription>
								You need to sign in to accept this invitation.
							</AlertDescription>
						</Alert>
					{/if}
				</div>
			</CardContent>
			<CardFooter class="flex justify-between">
				<Button 
					variant="outline" 
					disabled={isProcessing} 
					on:click={declineInvitation}
				>
					{session ? 'Decline' : 'Sign in to decline'}
				</Button>
				<Button 
					variant={session ? 'default' : 'outline'}
					disabled={isProcessing}
					on:click={acceptInvitation}
				>
					{isProcessing 
						? 'Processing...' 
						: session ? 'Accept Invitation' : 'Sign in to accept'}
				</Button>
			</CardFooter>
		</Card>
	{/if}
</div> -->
