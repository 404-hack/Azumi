<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Card from '$lib/components/ui/card';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import * as Select from '$lib/components/ui/select';
	import { Loader, Store, MapPin } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authClient } from '$lib/auth-client.js';
	import { createShopSchema } from '@repo/server/validations';
	import { client } from '$lib/hc.js';
	import { loginModalState } from '$lib/states/modalState.svelte.js';
	import LoginModal from '$lib/components/modal/LoginModal.svelte';
	import RegisterModal from '$lib/components/modal/RegisterModal.svelte';
	import PlacesInput from '$lib/components/ui/places-input/places-input.svelte';
	import { getCurrentPosition, reverseGeocode } from '$lib/utils/geolocation';
	import type { Place } from '$lib/types/places';
	import { Loader2 } from 'lucide-svelte';

	let { data } = $props();
	const session = authClient.useSession();

	$effect(() => {
		const urlShopType = page.url.searchParams.get('shopType');
		if (urlShopType) {
			$formData.type = urlShopType;
		}
	});

	const form = superForm(defaults(zod(createShopSchema)), {
		validators: zod(createShopSchema),
		SPA: true,
		resetForm: false,
		dataType: 'json',
		onUpdate: async ({ form }) => {
			// check if coordinates are selected
			if (form.data.address && form.data.longitude === 0 && form.data.latitude === 0) {
				toast.error(
					'Please select a location from the suggestions provided when typing your address'
				);
				return;
			}
			if (form.valid) {
				const res = await client.shop.create.$post({
					json: {
						name: form.data.name,
						type: form.data.type,
						email: form.data.email,
						phoneNumber: form.data.phoneNumber, // Updated to use phoneNumber instead of phone
						address: form.data.address,
						longitude: form.data.longitude,
						latitude: form.data.latitude,
						addressName: form.data.addressName // Updated to use form.data.addressName instead of form.data.coordinates.name
					}
				});
				if (res.ok) {
					await goto('/create-a-page/application-sent');
				} else {
					if (res.status === 401) {
						loginModalState.open('Sign in to create your store');
						toast.error('Please log in to continue with store creation');
					} else {
						toast.error('An error occurred while creating your store. Please try again later.');
					}
				}
				// check if the user is logged in
				// if ($session.data) {
				// } else {
				// 	registerModalState.setTrue();
				// 	toast.error('You need to be logged in to create a shop.');
				// }
			}
		}
	});

	const { form: formData, enhance, delayed, capture, restore, submit } = form;

	// Optional: Store coordinates for future use
	let selectedLocation = $state<{ lat: number; lng: number } | null>(null);

	// Function to handle place selection
	function handlePlaceSelect(place: Place) {
		if (place) {
			$formData.address = place.address;
			$formData.latitude = place.lat;
			$formData.longitude = place.lng;
			$formData.addressName = place.name;

			selectedLocation = { lat: place.lat, lng: place.lng };
		}
	}

	let isGettingLocation = $state(false);

	async function useCurrentLocation() {
		try {
			isGettingLocation = true;
			const position = await getCurrentPosition();
			const { latitude, longitude } = position.coords;

			selectedLocation = {
				lat: latitude,
				lng: longitude
			};

			const { address, name } = await reverseGeocode(latitude, longitude);
			$formData.address = address;
			$formData.latitude = latitude;
			$formData.longitude = longitude;
			$formData.addressName = name || address;
			toast.success('Location obtained successfully');
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to get location';
			toast.error(errorMessage);
		} finally {
			isGettingLocation = false;
		}
	}
</script>

<svelte:head>
	<title>Create Your Store - Azumi</title>
	<meta
		name="description"
		content="Create your store on Azumi and start selling to customers across Africa."
	/>
</svelte:head>

<div class=" mx-auto max-w-3xl pt-12 md:px-4">
	<div class="mb-10 text-center">
		<Store class="mx-auto mb-6 size-16 text-primary" />
		<h1 class="font-display text-4xl font-bold tracking-tight md:text-5xl">Create Your Store</h1>
		<p class="mt-3 text-lg text-muted-foreground">
			Join our marketplace and start selling to customers across Africa
		</p>
	</div>

	<form use:enhance class="space-y-8">
		<Card.Root>
			<Card.Header>
				<Card.Title>Store Information</Card.Title>
				<Card.Description>Tell us about your business</Card.Description>
			</Card.Header>

			<Card.Content class="space-y-6">
				<Form.Field {form} name="name">
					<Form.Control>
						{#snippet children({ props })}
							<div class="space-y-2">
								<Form.Label>Store Name</Form.Label>
								<Input {...props} bind:value={$formData.name} placeholder="Enter your store name" />
								<Form.Description>This is how customers will identify your store</Form.Description>
							</div>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="type">
					<Form.Control>
						{#snippet children({ props })}
							<div class="space-y-2">
								<Form.Label>Business Type</Form.Label>
								<Select.Root bind:value={$formData.type} type="single" name={props.name}>
									<Select.Trigger {...props} class="w-full capitalize">
										{data.shopTypes.find((shopType) => shopType.id === $formData.type)?.name ||
											'Select business type'}
									</Select.Trigger>
									<Select.Content>
										{#each data.shopTypes as shopType}
											<Select.Item value={shopType.id} class="capitalize" label={shopType.name} />
										{/each}
									</Select.Content>
								</Select.Root>
							</div>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<div class="grid gap-6 md:grid-cols-2">
					<Form.Field {form} name="email">
						<Form.Control>
							{#snippet children({ props })}
								<div class="space-y-2">
									<Form.Label>Email Address</Form.Label>
									<Input
										{...props}
										type="email"
										bind:value={$formData.email}
										placeholder="you@example.com"
									/>
								</div>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name="phoneNumber">
						<Form.Control>
							{#snippet children({ props })}
								<div class="space-y-2">
									<Form.Label>Phone Number</Form.Label>
									<Input
										{...props}
										type="tel"
										bind:value={$formData.phoneNumber}
										placeholder="+234..."
									/>
								</div>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</div>

				<Form.Field {form} name="address">
					<Form.Control>
						{#snippet children({ props })}
							<div class="relative space-y-2">
								<Form.Label>Business Address</Form.Label>
								<PlacesInput
									{...props}
									bind:value={$formData.address}
									onPlaceSelect={handlePlaceSelect}
								/>
								<Form.Description>
									Start typing to see address suggestions for locations across Nigeria.
								</Form.Description>
							</div>

							<Button
								type="button"
								variant="outline"
								onclick={() => useCurrentLocation()}
								class="mt-2 w-full"
								disabled={isGettingLocation}
							>
								{#if isGettingLocation}
									<Loader2 class="mr-2 h-4 w-4 animate-spin" />
									Getting location...
								{:else}
									<MapPin class="mr-2 h-4 w-4" />
									Use Current Location
								{/if}
							</Button>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</Card.Content>

			<Card.Footer class="flex flex-col space-y-4">
				<p class="text-xs text-muted-foreground">
					By creating a store, you agree to our Terms of Service and Privacy Policy. You must be at
					least 18 years old to operate a store on our platform.
				</p>
				<Button type="submit" class="w-full">
					{#if $delayed}
						<Loader class="mr-2 size-4 animate-spin" />
						Creating your store...
					{:else}
						Create Store
					{/if}
				</Button>
			</Card.Footer>
		</Card.Root>
	</form>
</div>
<LoginModal />

<style>
	/* Address suggestions dropdown styling */
	:global(.pac-container) {
		border-radius: 0.375rem;
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
		border: 1px solid rgb(229, 231, 235);
		margin-top: 0.25rem;
		z-index: 1000;
	}

	:global(.pac-item) {
		padding: 0.5rem 0.75rem;
		cursor: pointer;
	}

	:global(.pac-item:hover) {
		background-color: rgba(243, 244, 246);
	}
</style>
