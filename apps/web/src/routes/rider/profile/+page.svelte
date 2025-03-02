<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Tabs from '$lib/components/ui/tabs';
	import {
		User,
		Phone,
		Mail,
		Car,
		FileText,
		Building2,
		CreditCard,
		Star,
		Upload
	} from 'lucide-svelte';
	import type { RiderProfile } from '$lib/types/rider';

	// Mock profile data
	const profile: RiderProfile = {
		id: '1',
		name: 'John Doe',
		phone: '+234 123 456 7890',
		email: 'john.doe@example.com',
		vehicleType: 'motorcycle',
		vehicleDetails: {
			model: 'Honda CBF125',
			color: 'Black',
			plateNumber: 'ABC-123-XY'
		},
		rating: 4.8,
		totalDeliveries: 128,
		totalEarnings: 1875.5,
		status: 'available',
		documents: [
			{
				id: '1',
				type: 'license',
				status: 'verified',
				url: '/documents/license.pdf',
				expiryDate: new Date('2025-01-01')
			},
			{
				id: '2',
				type: 'insurance',
				status: 'verified',
				url: '/documents/insurance.pdf',
				expiryDate: new Date('2024-12-31')
			},
			{
				id: '3',
				type: 'registration',
				status: 'pending',
				url: '/documents/registration.pdf'
			}
		],
		bankDetails: {
			bankName: 'First Bank',
			accountNumber: '1234567890',
			accountName: 'John Doe'
		}
	};

	let selectedTab = $state('personal');

	const documentStatusColors = {
		verified: 'success',
		pending: 'warning',
		rejected: 'destructive'
	} as const;
</script>

<div class="space-y-8">
	<!-- Profile Header -->
	<div class="flex items-start justify-between">
		<div class="flex gap-4">
			<div class="h-20 w-20 overflow-hidden rounded-full bg-muted">
				<img
					src="https://api.dicebear.com/7.x/avataaars/svg?seed={profile.name}"
					alt="{profile.name}'s avatar"
					class="h-full w-full object-cover"
				/>
			</div>
			<div>
				<h2 class="text-2xl font-bold">{profile.name}</h2>
				<div class="mt-1 flex items-center gap-2 text-muted-foreground">
					<Star class="h-4 w-4 fill-yellow-400 text-yellow-400" />
					<span>{profile.rating} Rating</span>
					<span class="text-muted-foreground">•</span>
					<span>{profile.totalDeliveries} Deliveries</span>
				</div>
			</div>
		</div>
		<Button>Edit Profile</Button>
	</div>

	<!-- Profile Content -->
	<Tabs.Root value={selectedTab} class="space-y-6" onValueChange={(v) => (selectedTab = v)}>
		<Tabs.List>
			<Tabs.Trigger value="personal">Personal Info</Tabs.Trigger>
			<Tabs.Trigger value="vehicle">Vehicle Details</Tabs.Trigger>
			<Tabs.Trigger value="documents">Documents</Tabs.Trigger>
			<Tabs.Trigger value="bank">Bank Details</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="personal">
			<Card class="p-6">
				<div class="space-y-6">
					<div class="flex items-center gap-4">
						<User class="h-5 w-5 text-muted-foreground" />
						<div>
							<div class="font-medium">Full Name</div>
							<div class="text-muted-foreground">{profile.name}</div>
						</div>
					</div>
					<div class="flex items-center gap-4">
						<Phone class="h-5 w-5 text-muted-foreground" />
						<div>
							<div class="font-medium">Phone Number</div>
							<div class="text-muted-foreground">{profile.phone}</div>
						</div>
					</div>
					<div class="flex items-center gap-4">
						<Mail class="h-5 w-5 text-muted-foreground" />
						<div>
							<div class="font-medium">Email</div>
							<div class="text-muted-foreground">{profile.email}</div>
						</div>
					</div>
				</div>
			</Card>
		</Tabs.Content>

		<Tabs.Content value="vehicle">
			<Card class="p-6">
				<div class="space-y-6">
					<div class="flex items-center gap-4">
						<Car class="h-5 w-5 text-muted-foreground" />
						<div>
							<div class="font-medium">Vehicle Type</div>
							<div class="capitalize text-muted-foreground">{profile.vehicleType}</div>
						</div>
					</div>
					<div class="flex items-center gap-4">
						<FileText class="h-5 w-5 text-muted-foreground" />
						<div>
							<div class="font-medium">Model</div>
							<div class="text-muted-foreground">{profile.vehicleDetails.model}</div>
						</div>
					</div>
					<div class="flex items-center gap-4">
						<FileText class="h-5 w-5 text-muted-foreground" />
						<div>
							<div class="font-medium">Color</div>
							<div class="text-muted-foreground">{profile.vehicleDetails.color}</div>
						</div>
					</div>
					<div class="flex items-center gap-4">
						<FileText class="h-5 w-5 text-muted-foreground" />
						<div>
							<div class="font-medium">Plate Number</div>
							<div class="text-muted-foreground">{profile.vehicleDetails.plateNumber}</div>
						</div>
					</div>
				</div>
			</Card>
		</Tabs.Content>

		<Tabs.Content value="documents">
			<div class="grid gap-4 md:grid-cols-2">
				{#each profile.documents as document}
					<Card class="p-6">
						<div class="flex items-start justify-between">
							<div class="space-y-1">
								<h3 class="capitalize">{document.type}</h3>
								{#if document.expiryDate}
									<p class="text-sm text-muted-foreground">
										Expires: {new Date(document.expiryDate).toLocaleDateString()}
									</p>
								{/if}
							</div>
							<Badge variant={documentStatusColors[document.status]}>
								{document.status}
							</Badge>
						</div>
						<div class="mt-4">
							{#if document.status === 'pending'}
								<Button variant="outline" class="w-full">
									<Upload class="mr-2 h-4 w-4" />
									Upload New
								</Button>
							{:else}
								<Button variant="outline" class="w-full">View Document</Button>
							{/if}
						</div>
					</Card>
				{/each}
			</div>
		</Tabs.Content>

		<Tabs.Content value="bank">
			<Card class="p-6">
				<div class="space-y-6">
					<div class="flex items-center gap-4">
						<Building2 class="h-5 w-5 text-muted-foreground" />
						<div>
							<div class="font-medium">Bank Name</div>
							<div class="text-muted-foreground">{profile.bankDetails.bankName}</div>
						</div>
					</div>
					<div class="flex items-center gap-4">
						<CreditCard class="h-5 w-5 text-muted-foreground" />
						<div>
							<div class="font-medium">Account Number</div>
							<div class="text-muted-foreground">{profile.bankDetails.accountNumber}</div>
						</div>
					</div>
					<div class="flex items-center gap-4">
						<User class="h-5 w-5 text-muted-foreground" />
						<div>
							<div class="font-medium">Account Name</div>
							<div class="text-muted-foreground">{profile.bankDetails.accountName}</div>
						</div>
					</div>
				</div>
			</Card>
		</Tabs.Content>
	</Tabs.Root>
</div>
