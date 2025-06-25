<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Card } from '$lib/components/ui/card';
	import { Coins, ShieldQuestion } from 'lucide-svelte';
	import { page } from '$app/state';
	import { authClient } from '$lib/auth-client';
	let selectedTab = $state('personal');

	// Mock user data
	// const user = {
	// 	name: 'Lawal Adebola',
	// 	email: 'sphade012@gmail.com',
	// 	phone: '+2349087654543',
	// 	tokens: 0,
	// 	credits: 0.0
	// };
	let { data } = $props();
	function handleEdit() {
		// Implement edit functionality
	}

	function handleDelete() {
		// Implement delete functionality
	}
	let user = $derived(data.user);
	console.log('🚀 ~ user:', user);
</script>

<div class=" mx-auto max-w-5xl space-y-8 py-8">
	<div class="space-y-8">
		<!-- Profile Section -->
		<div class="flex items-start gap-4">
			<div class="bg-primary/10 h-20 w-20 overflow-hidden rounded-full text-center">
				<div class="flex h-full w-full items-center justify-center text-2xl font-semibold">
					{user?.name
						.split(' ')
						.map((n) => n[0])
						.join('')}
				</div>
			</div>
			<div class="flex-1">
				<h2 class="text-2xl font-semibold">{user?.name}</h2>
				<div class="mt-4 space-y-2">
					<div>
						<div class="text-muted-foreground text-sm">Email</div>
						<div>{user?.email}</div>
					</div>
					<div>
						<div class="text-muted-foreground text-sm">Phone number</div>
						<div>{user?.phoneNumber}</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Tokens and Credits -->
		<div class="grid gap-6 sm:grid-cols-2">
			<Card class="p-6">
				<div class="flex items-start justify-between">
					<div>
						<div class="flex items-center gap-2">
							<h3 class="text-lg font-semibold">Tokens</h3>
							<Button variant="ghost" size="icon" class="h-5 w-5">
								<ShieldQuestion class="h-4 w-4" />
							</Button>
						</div>
						<div class="mt-2 flex items-center gap-2">
							<Coins class="h-5 w-5 text-yellow-500" />
							<span class="text-xl font-semibold">{user?.tokens || 0} ×</span>
						</div>
						<p class="text-muted-foreground mt-2 text-sm">
							Each token will get you a standard delivery with no delivery fee.
						</p>
					</div>
				</div>
			</Card>

			<Card class="p-6">
				<div class="flex items-start justify-between">
					<div>
						<div class="flex items-center gap-2">
							<h3 class="text-lg font-semibold">Credits</h3>
							<Button variant="ghost" size="icon" class="h-5 w-5">
								<!-- <QuestionMarkCircled class="h-4 w-4" /> -->
							</Button>
						</div>
						<div class="mt-2">
							<span class="text-xl font-semibold">₦{user?.credits || 0}</span>
						</div>
						<p class="text-muted-foreground mt-2 text-sm">
							You can use credits to pay for your orders.
						</p>
					</div>
				</div>
			</Card>
		</div>
	</div>
</div>
