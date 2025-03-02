<script lang="ts">
	import { page } from '$app/stores';
	import { adminState } from '$lib/states/adminState.svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import { Bike, MapPin, Phone, Mail, FileText, AlertTriangle } from 'lucide-svelte';
	import { formatDate } from '$lib/utils';

	// Get application ID from URL params
	const applicationId = $page.params.id;

	// Mock application data (in real app, fetch from adminState or API)
	const application = {
		id: applicationId,
		name: 'John Smith',
		email: 'john@example.com',
		phone: '+234 123 456 7890',
		address: '123 Main St, Lagos',
		appliedDate: new Date('2024-02-01'),
		status: 'pending',
		vehicleType: 'motorcycle',
		vehicleDetails: {
			make: 'Honda',
			model: 'CB150R',
			year: '2022',
			color: 'Black',
			plateNumber: 'LAG-123-XY'
		},
		documents: [
			{
				type: 'Driver License',
				status: 'verified',
				number: 'DL123456',
				expiryDate: new Date('2025-01-01'),
				url: '#'
			},
			{
				type: 'Vehicle Insurance',
				status: 'pending',
				number: 'INS789012',
				expiryDate: new Date('2024-12-31'),
				url: '#'
			},
			{
				type: 'Vehicle Registration',
				status: 'pending',
				number: 'REG345678',
				expiryDate: new Date('2024-12-31'),
				url: '#'
			}
		],
		bankInfo: {
			bankName: 'First Bank',
			accountNumber: '1234567890',
			accountName: 'John Smith'
		}
	};

	function getDocumentStatusBadgeVariant(
		status: string
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status) {
			case 'verified':
				return 'default';
			case 'pending':
				return 'secondary';
			case 'rejected':
				return 'destructive';
			default:
				return 'outline';
		}
	}

	function handleApplication(approved: boolean) {
		// In real app, call adminState.reviewRiderApplication
		console.log(`Application ${approved ? 'approved' : 'rejected'}: ${applicationId}`);
	}
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<div class="space-y-1">
			<h2 class="text-2xl font-bold">Rider Application</h2>
			<p class="text-muted-foreground">Review rider application details</p>
		</div>
		<div class="flex items-center gap-4">
			<Button variant="outline" onclick={() => history.back()}>Back</Button>
			<div class="flex items-center gap-2">
				<Button variant="outline" onclick={() => handleApplication(false)}>Reject</Button>
				<Button onclick={() => handleApplication(true)}>Approve</Button>
			</div>
		</div>
	</div>

	<div class="grid gap-6 md:grid-cols-[400px_1fr]">
		<!-- Personal Information -->
		<Card class="p-6">
			<div class="space-y-6">
				<div class="flex flex-col items-center space-y-4">
					<div class="h-20 w-20 overflow-hidden rounded-full bg-muted">
						<img
							src="https://api.dicebear.com/7.x/avataaars/svg?seed={application.name}"
							alt="{application.name}'s avatar"
							class="h-full w-full"
						/>
					</div>
					<div class="text-center">
						<h3 class="font-semibold">{application.name}</h3>
						<p class="text-sm capitalize text-muted-foreground">{application.vehicleType} Rider</p>
					</div>
					<Badge variant="secondary">Application Pending</Badge>
				</div>

				<div class="space-y-4">
					<div class="space-y-2">
						<div class="flex items-center gap-2">
							<MapPin class="h-4 w-4 text-muted-foreground" />
							<span class="text-sm">{application.address}</span>
						</div>
						<div class="flex items-center gap-2">
							<Phone class="h-4 w-4 text-muted-foreground" />
							<span class="text-sm">{application.phone}</span>
						</div>
						<div class="flex items-center gap-2">
							<Mail class="h-4 w-4 text-muted-foreground" />
							<span class="text-sm">{application.email}</span>
						</div>
					</div>

					<div>
						<div class="text-sm text-muted-foreground">Applied Date</div>
						<div class="font-medium">{formatDate(application.appliedDate)}</div>
					</div>
				</div>

				<!-- Vehicle Information -->
				<div class="space-y-4">
					<h4 class="font-medium">Vehicle Information</h4>
					<div class="grid gap-4 sm:grid-cols-2">
						<div>
							<div class="text-sm text-muted-foreground">Make & Model</div>
							<div class="font-medium">
								{application.vehicleDetails.make}
								{application.vehicleDetails.model}
							</div>
						</div>
						<div>
							<div class="text-sm text-muted-foreground">Year</div>
							<div class="font-medium">{application.vehicleDetails.year}</div>
						</div>
						<div>
							<div class="text-sm text-muted-foreground">Color</div>
							<div class="font-medium">{application.vehicleDetails.color}</div>
						</div>
						<div>
							<div class="text-sm text-muted-foreground">Plate Number</div>
							<div class="font-medium">{application.vehicleDetails.plateNumber}</div>
						</div>
					</div>
				</div>
			</div>
		</Card>

		<div class="space-y-6">
			<!-- Documents -->
			<Card class="p-6">
				<h3 class="mb-4 font-semibold">Required Documents</h3>
				<div class="space-y-4">
					{#each application.documents as doc}
						<div class="flex items-center justify-between rounded-lg border p-4">
							<div class="flex items-center gap-4">
								<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
									<FileText class="h-6 w-6 text-primary" />
								</div>
								<div>
									<div class="font-medium">{doc.type}</div>
									<div class="text-sm text-muted-foreground">
										Number: {doc.number}
										<br />
										Expires: {formatDate(doc.expiryDate)}
									</div>
								</div>
							</div>
							<div class="flex items-center gap-4">
								<Badge variant={getDocumentStatusBadgeVariant(doc.status)}>
									{doc.status}
								</Badge>
								<Button variant="outline" size="sm" href={doc.url}>View</Button>
							</div>
						</div>
					{/each}
				</div>
			</Card>

			<!-- Banking Information -->
			<Card class="p-6">
				<h3 class="mb-4 font-semibold">Banking Information</h3>
				<div class="space-y-4">
					<div class="rounded-lg border p-4">
						<div class="grid gap-4">
							<div>
								<div class="text-sm text-muted-foreground">Bank Name</div>
								<div class="font-medium">{application.bankInfo.bankName}</div>
							</div>
							<div>
								<div class="text-sm text-muted-foreground">Account Number</div>
								<div class="font-medium">{application.bankInfo.accountNumber}</div>
							</div>
							<div>
								<div class="text-sm text-muted-foreground">Account Name</div>
								<div class="font-medium">{application.bankInfo.accountName}</div>
							</div>
						</div>
					</div>
				</div>
			</Card>
		</div>
	</div>
</div>
