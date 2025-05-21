<script lang="ts">
</script>

<div class="flex h-screen flex-col items-center justify-center gap-6 p-4 text-center">
	<img src="/logo.png" alt="Azumi Logo" class="h-20 w-auto" />
	<h1 class="text-3xl font-bold text-gray-800">You're Offline</h1>
	<p class="max-w-md text-gray-600">
		It looks like you're currently offline. Please check your internet connection and try again.
	</p>
	<button
		class="rounded-full bg-orange-500 px-6 py-2 font-semibold text-white transition hover:bg-orange-600"
		on:click={() => window.location.reload()}
	>
		Try Again
	</button>
</div>
