<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as Card from '$lib/components/ui/card';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import * as Select from '$lib/components/ui/select';
	import { Loader2, Bike, MapPin } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client.js';
	import { createRiderSchema } from '@repo/server/validations';
	import { client } from '$lib/hc.js';
	import { loginModalState, registerModalState } from '$lib/states/modalState.svelte.js';
	import LoginModal from '$lib/components/modal/LoginModal.svelte';
	import RegisterModal from '$lib/components/modal/RegisterModal.svelte';
	import PlacesInput from '$lib/components/ui/places-input/places-input.svelte';
	import { useLocation } from '$lib/hooks/useLocation.svelte';
	import type { Place } from '$lib/types/places';
	import { VEHICLE_TYPES } from '../../../../server/src/lib/constant';

	let { data } = $props();
	const session = authClient.useSession();
	const form = superForm(defaults(zod(createRiderSchema)), {
		validators: zod(createRiderSchema),
		SPA: true,
		resetForm: false,
		dataType: 'json',
		onUpdate: async ({ form }) => {
			if (form.data.address && form.data.latitude === 0 && form.data.longitude === 0) {
				toast.error('Please select a location from the suggestions.');
				return;
			}
			if (!data.user) {
				loginModalState.open('Sign in to create your rider account');
				return;
			}

			if (form.valid) {
				const res = await client.rider.apply.$post({
					json: {
						firstName: form.data.firstName,
						lastName: form.data.lastName,
						email: form.data.email,
						address: form.data.address,
						longitude: form.data.longitude,
						latitude: form.data.latitude,
						addressName: form.data.addressName,
						vehicleType: form.data.vehicleType,
						vehicleLicense: form.data.vehicleLicense
					}
				});

				if (res.ok) {
					await goto('/join-as-rider/application-sent');
				} else {
					if (res.status === 409) {
						toast.error('You have already applied as a rider.');
					} else if (res.status === 401) {
						toast.error('You need to be logged in to apply as a rider.');
						loginModalState.setTrue();
					} else {
						toast.error(
							'An error occurred while submitting your application. Please try again later.'
						);
					}
				}
			}
		}
	});
	const { form: formData, enhance, delayed, capture, restore, submit } = form;
	export const snapshot = { capture, restore };

	const location = useLocation({
		enableHighAccuracy: true,
		timeout: 25000,
		maximumAge: 0,
		showToasts: true,
		onLocationUpdate: (loc) => {
			console.log('Location updated:', loc);
		},
		onError: (err) => {
			console.error('Location error:', err);
		}
	});

	let selectedLocation = $state<{ lat: number; lng: number } | null>(null);

	function handlePlaceSelect(place: Place) {
		if (place) {
			$formData.address = place.address;
			$formData.latitude = place.lat;
			$formData.longitude = place.lng;
			$formData.addressName = place.name;
			selectedLocation = { lat: place.lat, lng: place.lng };
		}
	}

	async function useCurrentLocation() {
		try {
			const result = await location.getCurrentLocation();

			if (result) {
				$formData.address = result.address;
				$formData.latitude = result.coordinates.latitude;
				$formData.longitude = result.coordinates.longitude;
				$formData.addressName = result.name;
				selectedLocation = {
					lat: result.coordinates.latitude,
					lng: result.coordinates.longitude
				};
			}
		} catch (error: unknown) {
			console.error('Location error:', error);
		}
	}
</script>

<svelte:head>
	<title>Join As Rider - Azumi</title>
	<meta
		name="description"
		content="Join Azumi as a Pigeon  and earn money delivering packages across Africa."
	/>
</svelte:head>

<div class="mx-auto max-w-3xl pt-12 md:px-4">
	<div class="mb-10 text-center">
		<Bike class="text-primary mx-auto mb-6 size-16" />
		<h1 class="font-display text-4xl font-bold tracking-tight md:text-5xl">Join As Rider</h1>
		<p class="text-muted-foreground mt-3 text-lg">
			Become a Pigeon and earn money on your own schedule
		</p>
	</div>

	<form use:enhance class="space-y-8">
		<Card.Root>
			<Card.Header>
				<Card.Title>Personal Information</Card.Title>
				<Card.Description>Tell us about yourself</Card.Description>
			</Card.Header>

			<Card.Content class="space-y-6">
				<div class="grid gap-6 md:grid-cols-2">
					<Form.Field {form} name="firstName">
						<Form.Control>
							{#snippet children({ props })}
								<div class="space-y-2">
									<Form.Label>First Name</Form.Label>
									<Input
										{...props}
										bind:value={$formData.firstName}
										placeholder="Your first name"
									/>
								</div>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name="lastName">
						<Form.Control>
							{#snippet children({ props })}
								<div class="space-y-2">
									<Form.Label>Last Name</Form.Label>
									<Input {...props} bind:value={$formData.lastName} placeholder="Your last name" />
								</div>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</div>

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
				</div>

				<Form.Field {form} name="address">
					<Form.Control>
						{#snippet children({ props })}
							<div class="relative space-y-2">
								<Form.Label>Your Address</Form.Label>
								<PlacesInput
									{...props}
									bind:value={$formData.address}
									onPlaceSelect={handlePlaceSelect}
								/>
								<Form.Description>
									We use this to match you with deliveries in your area.
								</Form.Description>
							</div>
							<Button
								type="button"
								variant="outline"
								onclick={() => useCurrentLocation()}
								class="mt-2 w-full"
								disabled={location.isLoading}
							>
								{#if location.isLoading}
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
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Vehicle Information</Card.Title>
				<Card.Description>Tell us about your vehicle</Card.Description>
			</Card.Header>

			<Card.Content class="space-y-6">
				<Form.Field {form} name="vehicleType">
					<Form.Control>
						{#snippet children({ props })}
							<div class="space-y-2">
								<Form.Label>Vehicle Type</Form.Label>
								<Select.Root bind:value={$formData.vehicleType} type="single" name={props.name}>
									<Select.Trigger {...props} class="w-full">
										<span class="">
											{$formData.vehicleType
												? $formData.vehicleType.charAt(0).toUpperCase() +
													$formData.vehicleType.slice(1)
												: 'Select vehicle type'}
										</span>
									</Select.Trigger>
									<Select.Content>
										{#each VEHICLE_TYPES as v}
											<Select.Item value={v} label={v.charAt(0).toUpperCase() + v.slice(1)} />
										{/each}
									</Select.Content>
								</Select.Root>
							</div>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="vehicleLicense">
					<Form.Control>
						{#snippet children({ props })}
							<div class="space-y-2">
								<Form.Label>Vehicle License Number</Form.Label>
								<Input
									{...props}
									bind:value={$formData.vehicleLicense}
									placeholder="Enter license plate number"
								/>
								<Form.Description
									>Leave blank if you're delivering on foot or bicycle</Form.Description
								>
							</div>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</Card.Content>

			<Card.Footer class="flex flex-col space-y-4">
				<p class="text-muted-foreground text-xs">
					By registering as a rider, you agree to our Terms of Service and Privacy Policy. You must
					be at least 18 years old to become a rider on our platform.
				</p>
				<Button type="submit" class="w-full">
					{#if $delayed}
						<Loader2 class="mr-2 size-4 animate-spin" />
						Submitting application...
					{:else}
						Submit Application
					{/if}
				</Button>
			</Card.Footer>
		</Card.Root>
	</form>
</div>

<LoginModal title="You need to be logged in first before applying as a rider" />

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
