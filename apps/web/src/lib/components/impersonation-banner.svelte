<script lang="ts">
	import { onMount } from 'svelte';
	import { authClient } from '$lib/auth-client';

	let isImpersonating = $state(false);
	let impersonatedUser = $state<{ name?: string; id?: string } | null>(null);
	let originalAdminId = $state<string | null>(null);

	// Check if the current session is an impersonation session
	onMount(async () => {
		try {
			const session = await authClient.getSession();
			if (session?.data?.user && session.data?.session.impersonatedBy) {
				isImpersonating = true;
				impersonatedUser = {
					name: session.data.user.name || session.data.user.email?.split('@')[0] || 'Unknown',
					id: session.data.user.id
				};
				originalAdminId = session.data.session.impersonatedBy;
			}
		} catch (error) {
			console.error('Failed to check impersonation status:', error);
		}
	});
	// Function to stop impersonating and return to admin
	async function stopImpersonating() {
		try {
			await authClient.admin.stopImpersonating();

			// Show a brief notification
			alert('Impersonation ended. Returning to admin dashboard...');

			// Redirect to admin dashboard - give a slight delay to ensure the session is updated
			setTimeout(() => {
				window.location.href = '/superadmin/customers';
			}, 500);
		} catch (error) {
			console.error('Failed to stop impersonating:', error);
			alert('Failed to stop impersonation. Please try again.');
		}
	}
</script>

{#if isImpersonating}
	<div
		class="animate-pulse-slow fixed left-0 right-0 top-0 z-[100] flex items-center justify-between bg-red-600 px-4 py-3 text-white shadow-md"
	>
		<div class="flex items-center gap-2">
			<span class="rounded-md bg-yellow-400 px-2 py-1 font-bold text-red-800"
				>IMPERSONATION MODE</span
			>
			<span>
				Viewing as: <span class="font-semibold">{impersonatedUser?.name || 'Unknown User'}</span>
				<span class="text-sm opacity-70">({impersonatedUser?.id || 'Unknown ID'})</span>
			</span>
		</div>
		<button
			class="rounded-md bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-red-50"
			onclick={stopImpersonating}
		>
			Exit Impersonation & Return to Admin
		</button>
	</div>

	<!-- Add a spacer to push content down -->
	<div class="h-[52px]"></div>
{/if}
