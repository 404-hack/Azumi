<script lang="ts">
	import {
		Store,
		MapPin,
		Phone,
		Mail,
		Globe,
		Camera,
		Save,
		Loader2,
		Upload,
		Trash2
	} from 'lucide-svelte';
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
	import { useLocation } from '$lib/hooks/useLocation.svelte';
	import { onDestroy } from 'svelte';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	// Get the form from the server
	let { data } = $props();

	// Create the form using superForm
	const form = superForm(
		defaults(
			{
				...data.profile,
				phoneNumber: data.profile.phoneNumber,
				website: data.profile.website || ''
			},
			zod(updateShopSchema)
		),
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

	async function useCurrentLocation() {
		try {
			const result = await location.getCurrentLocation();

			if (result) {
				$formData.address = result.address;
				$formData.latitude = result.coordinates.latitude;
				$formData.longitude = result.coordinates.longitude;
				$formData.addressName = result.name;
			}
		} catch (error: unknown) {
			console.error('Location error:', error);
		}
	}

	function handlePlaceSelect(place: Place) {
		if (place) {
			$formData.address = place.address;
			$formData.latitude = place.lat;
			$formData.longitude = place.lng;
			$formData.addressName = place.name; // Update the addressName field with the address
		}
	}

	let coverImageInput: HTMLInputElement = $state();
	let coverImagePreview: string | null = $state(data.profile.coverImage || null);
	let coverImageUrl: string | null = $state(data.profile.coverImage || null);

	// Cleanup function to prevent memory leaks
	onDestroy(() => {
		if (coverImagePreview && !coverImagePreview.startsWith('http')) {
			URL.revokeObjectURL(coverImagePreview);
		}
	});

	// Image upload handling
	async function uploadImage(file: File) {
		try {
			// Validate file type
			const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
			if (!allowedTypes.includes(file.type)) {
				throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
			}

			// Validate file size (5MB)
			const maxSize = 5 * 1024 * 1024;
			if (file.size > maxSize) {
				throw new Error('File size exceeds 5MB limit.');
			}

			// Create FormData			const formData = new FormData();

			// // Upload image using the new banner endpoint
			// const res = await fetch('/api/vendor/banner', {
			// 	method: 'POST',
			// 	body: formData
			// });
			// use hono client
			const res = await client.vendor['cover-image'].$post({
				form: {
					file: file
				}
			});

			if (!res.ok) {
				throw new Error('Failed to upload cover image');
			}

			const data = await res.json();
			return data.data.url;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to upload image';
			toast.error(message);
			throw error;
		}
	}

	async function handleCoverImagePick(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (!file) {
			return;
		}

		try {
			// Show loading state
			const loadingToast = toast.loading('Uploading cover image...');

			// Upload the image
			const imageUrl = await uploadImage(file);

			// Update the preview and cover image URL
			coverImagePreview = imageUrl;
			coverImageUrl = imageUrl;

			// Clean up the loading state and show success
			toast.dismiss(loadingToast);
			toast.success('Cover image uploaded successfully');
		} catch (error) {
			if (coverImageInput) {
				coverImageInput.value = '';
			}
		}
	}

	async function removeCoverImage() {
		try {
			// Only make API call if there's an existing cover image
			if (coverImageUrl && coverImageUrl.startsWith('http')) {
				const res = await fetch(`${PUBLIC_API_BASE_URL}/api/vendor/cover-image`, {
					method: 'DELETE',
					credentials: 'include'
				});

				if (!res.ok) {
					throw new Error('Failed to remove cover image');
				}
			}

			// Reset states
			coverImagePreview = null;
			coverImageUrl = null;
			if (coverImageInput) {
				coverImageInput.value = '';
			}

			toast.success('Banner image removed successfully');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to remove image';
			toast.error(message);
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
						<Form.Field {form} name="phoneNumber">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Phone Number</Form.Label>
									<Input
										{...props}
										type="tel"
										bind:value={$formData.phoneNumber}
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
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Store Banner -->
			<Card.Root class="md:col-span-2">
				<Card.Header>
					<Card.Title class="flex items-center">
						<Camera class="mr-2 h-5 w-5" />
						Store Banner
					</Card.Title>
					<Card.Description>
						Add a banner image to make your store stand out. Recommended size: 1200x300 pixels.
					</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="space-y-4">
						<div
							class="relative aspect-[21/9] w-full overflow-hidden rounded-lg border-2 border-dashed bg-gray-50"
						>
							{#if coverImagePreview}
								<img
									src={coverImagePreview}
									alt="Banner Preview"
									class="h-full w-full object-cover"
								/>
								<div
									class="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all hover:bg-black/40 hover:opacity-100"
								>
									<Button
										type="button"
										variant="destructive"
										size="sm"
										class="h-9 w-9"
										onclick={removeCoverImage}
									>
										<Trash2 class="h-4 w-4" />
									</Button>
									<Button
										type="button"
										variant="secondary"
										size="sm"
										class="h-9 w-9"
										onclick={() => coverImageInput?.click()}
									>
										<Camera class="h-4 w-4" />
									</Button>
								</div>
							{:else}
								<label
									class="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2"
									for="banner-upload"
								>
									<Camera class="h-8 w-8 text-gray-400" />
									<div class="text-center">
										<p class="text-sm font-medium text-gray-900">Upload banner image</p>
										<p class="text-xs text-gray-500">PNG, JPG or WebP up to 5MB</p>
									</div>
								</label>
							{/if}
						</div>

						<input
							id="banner-upload"
							type="file"
							class="hidden"
							accept="image/png,image/jpeg,image/webp"
							bind:this={coverImageInput}
							onchange={handleCoverImagePick}
						/>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	</form>
</div>
