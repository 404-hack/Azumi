<script lang="ts">
	import {
		CheckCircle2,
		ChevronLeft,
		Clock,
		Map,
		Share2,
		MapPin,
		User,
		Package,
		Phone,
		Truck
	} from 'lucide-svelte';
	import { Confetti } from 'svelte-confetti';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';

	let { data } = $props();
	console.log('🚀 ~ data:', data.order);
	// Generate a random 4-digit code for demo purposes
	const confirmationCode = Math.floor(1000 + Math.random() * 9000)
		.toString()
		.split('');
	const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

	// For demo purposes - would be fetched from API
	const orderStatus = {
		received: true,
		preparing: false,
		riderAccepted: false,
		riderAtVendor: false
	};

	// Timeline steps data
	const timelineSteps = [
		{
			title: 'Order Received',
			description: 'Waiting for vendor to confirm your order.',
			icon: CheckCircle2,
			status: orderStatus.received,
			showCancelButton: true,
			time: currentTime
		},
		{
			title: 'Preparing Your Order',
			description: 'Your order will be ready in 1 minute',
			icon: Package,
			status: orderStatus.preparing
		},
		{
			title: 'Rider Accepted Order',
			description: 'Your order has been assigned to a rider.',
			icon: User,
			status: orderStatus.riderAccepted
		},
		{
			title: 'Rider At The Vendor',
			description: 'Rider is waiting to pick up your order',
			icon: Clock,
			status: orderStatus.riderAtVendor
		}
	];
</script>

<!-- Keep the confetti animation -->
<div
	style="
 position: fixed;
 top: -50px;
 left: 0;
 height: 100vh;
 width: 100vw;
 display: flex;
 justify-content: center;
 overflow: hidden;
 pointer-events: none;"
>
	<Confetti
		x={[-5, 5]}
		y={[0, 0.1]}
		delay={[500, 2000]}
		duration={5000}
		amount={200}
		fallDistance="100vh"
	/>
</div>

<!-- Main container -->
<div class="mx-auto max-w-xl bg-white pb-8">
	<!-- Header with back button -->
	<header class="sticky top-0 z-50 flex items-center border-b border-gray-100 bg-white px-4 py-4">
		<a href="/" class="flex items-center">
			<ChevronLeft class="h-5 w-5" />
		</a>
		<h1 class="flex-1 text-center text-lg font-semibold">{data.order.customer.name}</h1>
	</header>

	<!-- Status message with phone illustration -->
	<div class="flex items-center justify-between px-4 pb-5 pt-6">
		<p class="text-sm text-gray-600">Your order will be confirmed shortly</p>
		<div class="flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
			<Phone class="h-6 w-6 text-green-500" />
		</div>
	</div>
	<!-- Confirmation code -->
	<div class="border-b border-gray-100 px-4 pb-5">
		<p class="mb-2 text-sm text-gray-500">Delivery confirmation code</p>
		<div class="flex flex-col gap-1">
			<p class="mb-2 font-medium">Share this code with your rider</p>
			<div class="flex gap-2">
				{#each data.order.riderConfirmationCode.toString().split('') as digit}
					<div
						class="flex h-12 w-10 items-center justify-center rounded-lg bg-gray-100 text-xl font-semibold"
					>
						{digit}
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Order timeline -->
	<div class="px-4 py-5">
		<!-- Timeline -->
		<div class="relative">
			<!-- Timeline line -->
			<div class="absolute bottom-0 left-5 top-2 w-0.5 bg-gray-200" />

			{#each timelineSteps as step, index}
				<div class="relative mb-8 flex last:mb-0">
					<div
						class="z-10 flex h-10 w-10 items-center justify-center rounded-full {step.status
							? 'bg-green-50'
							: 'bg-gray-200'}"
					>
						<svelte:component
							this={step.icon}
							class="h-6 w-6 {step.status ? 'text-green-500' : 'text-gray-400'}"
						/>
					</div>
					<div class="ml-4 flex-grow">
						<h3 class="font-medium {step.status ? 'text-green-600' : 'text-gray-700'}">
							{step.title}
						</h3>
						<p class="text-sm text-gray-600">{step.description}</p>
						{#if step.time}
							<div class="flex justify-between">
								<p class="text-sm text-gray-500">{step.time}</p>
							</div>
						{/if}
						{#if step.showCancelButton}
							<Button
								variant="outline"
								class="mt-3 h-10 w-full rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
							>
								Cancel Order
							</Button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
	<!-- Delivery Details -->
	<div class="border-t border-gray-100 px-4 py-4">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="font-medium">Delivery details</h2>
			<Button variant="ghost" class="flex h-auto items-center gap-1 p-0 text-sm text-blue-500">
				<Share2 class="h-4 w-4" />
				Share trip
			</Button>
		</div>

		<div class="mb-4 flex gap-3">
			<MapPin class="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500" />
			<div class="w-full">
				<p class="text-sm text-gray-800">
					{data.order.addressName}
				</p>
				<div class="flex justify-end">
					<Button
						variant="outline"
						class="mt-1 h-8 border-green-50 bg-white text-sm text-green-600 hover:bg-white"
						>UPDATE</Button
					>
				</div>
			</div>
		</div>
		<!-- Delivery Instructions -->
		<div class="flex gap-3">
			<Truck class="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500" />
			<div class="w-full">
				<p class="text-sm text-gray-500">Delivery instructions</p>
				<p class="mb-1 text-sm text-gray-800">Call when you arrive at the gate</p>
				<p class="mb-1 text-sm text-gray-800">{data.order.deliveryNotes}</p>
				<div class="flex justify-end">
					<Button
						variant="outline"
						class="h-8 border-green-50 bg-white text-sm text-green-600 hover:bg-white"
						>UPDATE</Button
					>
				</div>
			</div>
		</div>
	</div>
	<!-- Your Order -->
	<div class="border-t border-gray-100 px-4 py-4">
		<div class="mb-2 flex items-center justify-between">
			<h2 class="font-medium">Your order</h2>
			{#if data.order.riderId}
				<Button variant="outline" class="h-8 border-gray-200 bg-gray-100 text-sm text-gray-600"
					>CALL RIDER</Button
				>
			{/if}
		</div>

		<p class="mb-2 text-sm font-medium text-gray-800">{data.order.shop.name}</p>

		<div class="mb-6">
			{#each data.order.items as item}
				<div class="mb-2">
					<div class="flex justify-between">
						<p class="text-sm text-gray-800">{item.menuItemName} x {item.quantity}</p>
						<p class="text-sm text-gray-800">₦{item.totalPrice.toLocaleString()}</p>
					</div>
					{#if item.specialInstructions}
						<p class="text-xs text-gray-500">Note: {item.specialInstructions}</p>
					{/if}
					{#if item.options && item.options.length > 0}
						<!-- Group options by optionGroup.name -->
						{@const groupedOptions = item.options.reduce<Record<string, typeof item.options>>(
							(acc, opt) => {
								const groupName = opt.optionGroup?.name || 'Other';
								if (!acc[groupName]) acc[groupName] = [];
								acc[groupName].push(opt);
								return acc;
							},
							{}
						)}

						{#each Object.entries(groupedOptions) as [groupName, options]}
							<div class="ml-4 mt-2 rounded-md bg-gray-50/50 p-2">
								<p class="text-xs font-semibold text-gray-700">{groupName}</p>
								<div class="mt-1.5 space-y-1">
									{#each options as option}
										<div class="flex justify-between rounded bg-white px-2 py-1 text-xs">
											<span class="text-gray-600">
												<span class="text-gray-400">•</span>
												{option.optionName}
												<span class="ml-1 text-gray-400">×{option.quantity}</span>
											</span>
											{#if option.price && option.price > 0}
												<span class="font-medium text-gray-700"
													>+₦{option.price.toLocaleString()}</span
												>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						{/each}
					{/if}
				</div>
			{/each}
		</div>

		<!-- Order Summary -->
		<div class="space-y-2">
			<div class="flex justify-between">
				<p class="text-sm text-gray-500">Subtotal</p>
				<p class="text-sm text-gray-600">₦{data.order.subtotal.toLocaleString()}</p>
			</div>
			<div class="flex justify-between">
				<p class="text-sm text-gray-500">Delivery fee</p>
				<p class="text-sm text-gray-600">₦{data.order.deliveryFee.toLocaleString()}</p>
			</div>
			<div class="flex justify-between">
				<p class="text-sm text-gray-500">Service fee</p>
				<p class="text-sm text-gray-600">₦{data.order.serviceFee.toLocaleString()}</p>
			</div>
			{#if data.order.discount > 0}
				<div class="flex justify-between">
					<p class="text-sm text-gray-500">Discount</p>
					<p class="text-sm text-green-600">-₦{data.order.discount.toLocaleString()}</p>
				</div>
			{/if}
			<div class="flex justify-between border-t border-gray-100 pt-2">
				<p class="font-medium">Total</p>
				<p class="font-medium">₦{data.order.total.toLocaleString()}</p>
			</div>
		</div>
	</div>
</div>
