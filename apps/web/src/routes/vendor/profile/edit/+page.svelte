<script lang="ts">
	import { Store, MapPin, Phone, Mail, Globe, Camera, Save, Loader2 } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Form from '$lib/components/ui/form';
	import * as Tabs from '$lib/components/ui/tabs';
	import { defaults, superForm } from 'sveltekit-superforms';
	// import { formSchema } from './schema';
	import { zod } from 'sveltekit-superforms/adapters';
	import { updateShopSchema } from '@repo/server/validations';
	import { client } from '$lib/hc';
	import { getCurrentPosition, reverseGeocode } from '$lib/utils/geolocation.js';
	import { toast } from 'svelte-sonner';
	import PlacesInput from '$lib/components/ui/places-input/places-input.svelte';
	import type { Place } from '$lib/types/places.js';
	// Get the form from the server
	let { data } = $props();
	console.log('🚀 ~ data:', data);

	// Create the form using superForm
	const form = superForm(
		defaults({ ...data.profile, phone: data.profile.phoneNumber }, zod(updateShopSchema)),
		{
			validators: zod(updateShopSchema),
			SPA: true, // Enable client-side form handling (SPA mode)
			resetForm: false, // Don't reset form after submission
			dataType: 'json',
			onUpdated: async ({ form }) => {
				if (form.valid) {
					const res = await client.vendor.$patch({
						json: {
							...form.data
						}
					});

					if (res.ok) {
						toast.success('Profile updated successfully');
					} else {
						toast.error('Failed to update profile');
					}
				}
			},
			onError: ({ result }) => {
				console.error('Form submission error:', result.error);
				// Handle errors appropriately
			}
		}
	);
	const { form: formData, delayed, submitting, enhance, errors } = form;

	let isGettingLocation = $state(false);

	async function useCurrentLocation() {
		try {
			isGettingLocation = true;
			const position = await getCurrentPosition();
			const { latitude, longitude } = position.coords;

			const address = await reverseGeocode(latitude, longitude);
			$formData.address = address;
			$formData.coordinates = {
				lat: latitude,
				lng: longitude,
				address,
				name: address
			};
			toast.success('Location obtained successfully');
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to get location';
			toast.error(errorMessage);
		} finally {
			isGettingLocation = false;
		}
	}

	function handlePlaceSelect(place: Place) {
		if (place) {
			$formData.coordinates = {
				lat: place.lat,
				lng: place.lng,
				address: place.address,
				name: place.name
			};
		}
	}
</script>

<div class="container mx-auto space-y-6 p-4">
	<form method="POST" use:enhance class="space-y-6">
		<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
			<h1 class="text-3xl font-bold">Store Details</h1>
			<Button type="submit" disabled={$submitting}>
				{#if $submitting}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Saving...
				{:else}
					<Save class="mr-2 h-4 w-4" />
					Save Changes
				{/if}
			</Button>
		</div>

		<div class="grid gap-6 md:grid-cols-2">
			<!-- Basic Information -->
			<Card.Root class="md:col-span-2">
				<Card.Header>
					<Card.Title class="flex items-center">
						<Store class="mr-2 h-5 w-5" />
						Basic Information
					</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="space-y-4">
						<Form.Field {form} name="name">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Store Name</Form.Label>
									<Input
										{...props}
										bind:value={$formData.name}
										placeholder="Enter your store name"
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Field {form} name="description">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Store Description</Form.Label>
									<Textarea
										{...props}
										bind:value={$formData.description}
										placeholder="Describe your store"
										rows={4}
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Contact Information -->
			<Card.Root>
				<Card.Header>
					<Card.Title class="flex items-center">
						<Phone class="mr-2 h-5 w-5" />
						Contact Information
					</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="space-y-4">
						<Form.Field {form} name="phone">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Phone Number</Form.Label>
									<Input
										{...props}
										type="tel"
										bind:value={$formData.phone}
										placeholder="Enter phone number"
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Field {form} name="email">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Email Address</Form.Label>
									<Input
										{...props}
										type="email"
										bind:value={$formData.email}
										placeholder="Enter email address"
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Field {form} name="website">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Website</Form.Label>
									<Input
										{...props}
										type="url"
										bind:value={$formData.website}
										placeholder="Enter website URL"
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Location Information -->
			<Card.Root>
				<Card.Header>
					<Card.Title class="flex items-center">
						<MapPin class="mr-2 h-5 w-5" />
						Location
					</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="space-y-4">
						<Form.Field {form} name="address">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Street Address</Form.Label>

									<PlacesInput
										{...props}
										bind:value={$formData.address}
										onPlaceSelect={handlePlaceSelect}
									/>
									<Form.Description>
										Start typing to see address suggestions for locations across Nigeria.
									</Form.Description>
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
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Store Images -->
			<!-- <Card.Root class="md:col-span-2">
				<Card.Header>
					<Card.Title class="flex items-center">
						<Camera class="mr-2 h-5 w-5" />
						Store Images
					</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="grid gap-6 md:grid-cols-2">
						<div>
							<Form.Field {form} name="logo">
								<Form.Control>
									{#snippet children({ props })}
										<Form.Label class="mb-2 block">Store Logo</Form.Label>
										<div
											class="relative aspect-square w-full overflow-hidden rounded-lg border-2 border-dashed"
										>
											<img src={$formData.logo} alt="Store Logo" class="h-full w-full object-cover" />
											<Button
												type="button"
												variant="secondary"
												class="absolute bottom-4 left-1/2 -translate-x-1/2"
												on:click={handleLogoUpload}
											>
												<Camera class="mr-2 h-4 w-4" />
												Change Logo
											</Button>
										</div>
									{/snippet}
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>
						</div>
						<div>
							<Form.Field {form} name="coverImage">
								<Form.Control>
									{#snippet children({ props })}
										<Form.Label class="mb-2 block">Cover Image</Form.Label>
										<div
											class="relative aspect-video w-full overflow-hidden rounded-lg border-2 border-dashed"
										>
											<img
												src={$form.coverImage}
												alt="Cover Image"
												class="h-full w-full object-cover"
											/>
											<Button
												type="button"
												variant="secondary"
												class="absolute bottom-4 left-1/2 -translate-x-1/2"
												on:click={handleCoverUpload}
											>
												<Camera class="mr-2 h-4 w-4" />
												Change Cover
											</Button>
										</div>
									{/snippet}
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>
						</div>
					</div>
				</Card.Content>
			</Card.Root> -->
		</div>
	</form>
</div>
