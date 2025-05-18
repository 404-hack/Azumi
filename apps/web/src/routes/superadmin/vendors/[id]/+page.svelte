<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Store, MapPin, Phone, Mail, Clock, Star } from 'lucide-svelte';
	import { formatCurrency, formatDate, formatTime } from '$lib/utils';
	import { client } from '$lib/hc';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();
	let selectedTab = $state('overview');
	let vendor = $derived(data.vendor);
	let loading = $state(false);

	async function handleVendorAction(action: 'suspend' | 'activate' | 'approve' | 'reject') {
		try {
			loading = true;
			const newStatus = action === 'suspend' ? 'SUSPENDED' 
				: action === 'approve' ? 'APPROVED'
				: action === 'reject' ? 'REJECTED'
				: 'APPROVED'; // fallback for activate

			await client.admin.vendors[':id'].status.$patch({
				param: {
					id: vendor.id
				},
				json: {
					status: newStatus,
					active: action === 'activate' || action === 'approve'
				}
			});
			await invalidateAll();
		} catch (error) {
			console.error(`Failed to ${action} vendor:`, error);
		} finally {
			loading = false;
		}
	}

	function getDocumentStatusBadgeVariant(
		status: string
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status) {
			case 'verified':
				return 'default';
			case 'pending':
				return 'secondary';
			case 'expired':
				return 'destructive';
			default:
				return 'outline';
		}
	}
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<div class="space-y-1">
			<h2 class="text-2xl font-bold">Vendor Profile</h2>
			<p class="text-muted-foreground">Manage vendor information and performance</p>
		</div>
		<div class="flex items-center gap-4">			<Button variant="outline" onclick={() => history.back()}>Back</Button>
			<div class="flex items-center gap-2">
				{#if vendor.status === 'APPROVED'}
					<Button variant="destructive" onclick={() => handleVendorAction('suspend')} disabled={loading}>
						{loading ? 'Suspending...' : 'Suspend Vendor'}
					</Button>
				{:else if vendor.status === 'SUSPENDED'}
					<Button variant="default" onclick={() => handleVendorAction('activate')} disabled={loading}>
						{loading ? 'Activating...' : 'Reactivate Vendor'}
					</Button>
				{:else if vendor.status === 'PENDING'}
					<Button variant="default" onclick={() => handleVendorAction('approve')} disabled={loading}>
						{loading ? 'Approving...' : 'Approve Vendor'}
					</Button>
					<Button variant="destructive" onclick={() => handleVendorAction('reject')} disabled={loading}>
						{loading ? 'Rejecting...' : 'Reject Vendor'}
					</Button>
				{:else if vendor.status === 'DRAFT'}
					<Button variant="default" onclick={() => handleVendorAction('approve')} disabled={loading}>
						{loading ? 'Approving...' : 'Approve Draft'}
					</Button>
					<Button variant="destructive" onclick={() => handleVendorAction('reject')} disabled={loading}>
						{loading ? 'Rejecting...' : 'Reject Draft'}
					</Button>
				{:else if vendor.status === 'REJECTED'}
					<Button variant="default" onclick={() => handleVendorAction('approve')} disabled={loading}>
						{loading ? 'Approving...' : 'Approve Vendor'}
					</Button>
				{:else}
					<Button variant="outline" disabled>
						{vendor.status?.charAt(0) + vendor.status?.slice(1).toLowerCase() || 'Unknown'}
					</Button>
				{/if}
			</div>
		</div>
	</div>

	<div class="grid gap-6 md:grid-cols-[300px_1fr]">
		<Card class="p-6">
			<div class="space-y-6">
				<div class="flex flex-col items-center space-y-4">
					<div class="flex h-20 w-20 items-center justify-center rounded-lg bg-primary/10">
						<Store class="h-10 w-10 text-primary" />
					</div>
				<div class="text-center w-full">
					<h3 class="font-semibold">{vendor.name}</h3>
					<p class="text-sm text-muted-foreground">{vendor.shopType}</p>
				</div>
				{#if vendor.owner}
					<div class="w-full rounded-lg border bg-muted/50 p-4 flex flex-col items-center mt-2">
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
								{vendor.owner.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
							</div>
							<div>
								<div class="font-semibold text-base">{vendor.owner.name}</div>
								<div class="text-xs text-muted-foreground">{vendor.owner.email}</div>
								<a class="text-primary underline text-xs" href={vendor.owner.id ? `/superadmin/users/${vendor.owner.id}` : '#'}>View Owner Profile</a>
							</div>
						</div>
					</div>
				{/if}
<Badge variant={vendor.status === 'APPROVED' ? 'default' : vendor.status === 'SUSPENDED' ? 'secondary' : 'outline'}>
	{vendor.status?.charAt(0) + vendor.status?.slice(1).toLowerCase() || 'Unknown'}
</Badge>
				</div>

				<div class="space-y-2">
					<div class="flex items-center gap-2">
						<MapPin class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm">{vendor.address}</span>
					</div>
					<div class="flex items-center gap-2">
						<Phone class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm">{vendor.phoneNumber}</span>
					</div>
					<div class="flex items-center gap-2">
						<Mail class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm">{vendor.email}</span>
					</div>
					<div class="flex items-center gap-2">
						<Clock class="h-4 w-4 text-muted-foreground" />
						<span class="text-sm">Joined {formatDate(vendor.createdAt)}</span>
					</div>
				</div>

				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-sm text-muted-foreground">Commission</span>
						<span class="font-medium">{vendor.commission}%</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-muted-foreground">Website</span>
						<span class="font-medium">{vendor.website}</span>
					</div>
				</div>
			</div>
		</Card>

		<div class="space-y-6">
			<Tabs.Root value={selectedTab} onValueChange={(v) => (selectedTab = v)}>
				<Tabs.List>
					<Tabs.Trigger value="overview">Overview</Tabs.Trigger>
					<Tabs.Trigger value="documents">Documents</Tabs.Trigger>
					<Tabs.Trigger value="banking">Banking</Tabs.Trigger>
					<Tabs.Trigger value="orders">Orders</Tabs.Trigger>
				</Tabs.List>

				{#if selectedTab === 'overview'}
					<div class="grid gap-6">
						<Card class="p-6">
							<h3 class="mb-4 font-semibold">Operating Hours</h3>
							{#if vendor.operatingHours && vendor.operatingHours.length > 0}
								<div class="grid gap-2">
									{#each vendor.operatingHours as hours}
										<div class="flex items-center justify-between">
											<span class="capitalize">{hours.day}</span>
											<span class="text-sm">
												{formatTime(hours.openTime)} - {formatTime(hours.closeTime)}
											</span>
										</div>
									{/each}
								</div>
							{:else}
								<div class="text-muted-foreground text-sm">No operating hours set</div>
							{/if}
						</Card>
					</div>
				{:else if selectedTab === 'documents'}
					<Card class="p-6">
						<h3 class="mb-4 font-semibold">Business Documents</h3>
						{#if vendor.documents && vendor.documents.length > 0}
							<div class="space-y-4">
								{#each vendor.documents as doc}
									<div class="flex items-center justify-between rounded-lg border p-4">
										<div>
											<div class="font-medium">{doc.type}</div>
											<div class="text-sm text-muted-foreground">
												Expires: {formatDate(doc.expiryDate)}
											</div>
										</div>
										<Badge variant={getDocumentStatusBadgeVariant(doc.status)}>
											{doc.status}
										</Badge>
									</div>
								{/each}
							</div>
						{:else}
							<div class="text-muted-foreground text-sm">No documents uploaded</div>
						{/if}
					</Card>
				{:else if selectedTab === 'banking'}
					<Card class="p-6">
						<h3 class="mb-4 font-semibold">Banking Information</h3>
						{#if vendor.bankInfo}
							<div class="space-y-4">
								<div class="rounded-lg border p-4">
									<div class="mb-4 grid gap-2">
										<div>
											<div class="text-sm text-muted-foreground">Bank Name</div>
											<div class="font-medium">{vendor.bankInfo.bankName}</div>
										</div>
										<div>
											<div class="text-sm text-muted-foreground">Account Number</div>
											<div class="font-medium">{vendor.bankInfo.accountNumber}</div>
										</div>
										<div>
											<div class="text-sm text-muted-foreground">Account Name</div>
											<div class="font-medium">{vendor.bankInfo.accountName}</div>
										</div>
									</div>
									<Button variant="outline" class="w-full">Update Banking Information</Button>
								</div>
							</div>
						{:else}
							<div class="text-muted-foreground text-sm">No banking information</div>
						{/if}
					</Card>
				{:else if selectedTab === 'orders'}
					<Card class="p-6">
						<h3 class="mb-4 font-semibold">Orders</h3>
						<div class="text-muted-foreground text-sm">No orders available</div>
					</Card>
				{/if}
			</Tabs.Root>
		</div>
	</div>
</div>
