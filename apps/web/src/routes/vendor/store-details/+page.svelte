<script lang="ts">
	import { Store, MapPin, Phone, Mail, Globe, Camera, Save } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Tabs from '$lib/components/ui/tabs';

	let storeDetails = $state({
		name: 'Tasty Bites Restaurant',
		description:
			'We serve the most delicious African cuisine in town. Our recipes have been passed down through generations.',
		address: '123 Foodie Street',
		city: 'Flavor Town',
		state: 'FT',
		zipCode: '12345',
		phone: '+1 234-567-8900',
		email: 'contact@tastybites.com',
		website: 'www.tastybites.com',
		logo: '/placeholder.svg',
		coverImage: '/placeholder.svg'
	});

	function handleLogoUpload() {
		// Implement logo upload functionality
		console.log('Logo upload clicked');
	}

	function handleCoverUpload() {
		// Implement cover image upload functionality
		console.log('Cover upload clicked');
	}

	function saveStoreDetails() {
		// Implement save functionality
		console.log('Save store details:', storeDetails);
	}
</script>

<div class="container mx-auto space-y-6 p-4">
	<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
		<h1 class="text-3xl font-bold">Store Details</h1>
		<Button on:click={saveStoreDetails}>
			<Save class="mr-2 h-4 w-4" />
			Save Changes
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
					<div>
						<Label for="store-name">Store Name</Label>
						<Input
							id="store-name"
							bind:value={storeDetails.name}
							placeholder="Enter your store name"
						/>
					</div>
					<div>
						<Label for="store-description">Store Description</Label>
						<Textarea
							id="store-description"
							bind:value={storeDetails.description}
							placeholder="Describe your store"
							rows={4}
						/>
					</div>
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
					<div>
						<Label for="phone">Phone Number</Label>
						<Input
							id="phone"
							type="tel"
							bind:value={storeDetails.phone}
							placeholder="Enter phone number"
						/>
					</div>
					<div>
						<Label for="email">Email Address</Label>
						<Input
							id="email"
							type="email"
							bind:value={storeDetails.email}
							placeholder="Enter email address"
						/>
					</div>
					<div>
						<Label for="website">Website</Label>
						<Input
							id="website"
							type="url"
							bind:value={storeDetails.website}
							placeholder="Enter website URL"
						/>
					</div>
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
					<div>
						<Label for="address">Street Address</Label>
						<Input
							id="address"
							bind:value={storeDetails.address}
							placeholder="Enter street address"
						/>
					</div>
					<div class="grid gap-4 sm:grid-cols-3">
						<div>
							<Label for="city">City</Label>
							<Input id="city" bind:value={storeDetails.city} placeholder="Enter city" />
						</div>
						<div>
							<Label for="state">State</Label>
							<Input id="state" bind:value={storeDetails.state} placeholder="Enter state" />
						</div>
						<div>
							<Label for="zip">ZIP Code</Label>
							<Input id="zip" bind:value={storeDetails.zipCode} placeholder="Enter ZIP code" />
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Store Images -->
		<Card.Root class="md:col-span-2">
			<Card.Header>
				<Card.Title class="flex items-center">
					<Camera class="mr-2 h-5 w-5" />
					Store Images
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="grid gap-6 md:grid-cols-2">
					<div>
						<Label class="mb-2 block">Store Logo</Label>
						<div
							class="relative aspect-square w-full overflow-hidden rounded-lg border-2 border-dashed"
						>
							<img src={storeDetails.logo} alt="Store Logo" class="h-full w-full object-cover" />
							<Button
								variant="secondary"
								class="absolute bottom-4 left-1/2 -translate-x-1/2"
								on:click={handleLogoUpload}
							>
								<Camera class="mr-2 h-4 w-4" />
								Change Logo
							</Button>
						</div>
					</div>
					<div>
						<Label class="mb-2 block">Cover Image</Label>
						<div
							class="relative aspect-video w-full overflow-hidden rounded-lg border-2 border-dashed"
						>
							<img
								src={storeDetails.coverImage}
								alt="Cover Image"
								class="h-full w-full object-cover"
							/>
							<Button
								variant="secondary"
								class="absolute bottom-4 left-1/2 -translate-x-1/2"
								on:click={handleCoverUpload}
							>
								<Camera class="mr-2 h-4 w-4" />
								Change Cover
							</Button>
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</div>
</div>
