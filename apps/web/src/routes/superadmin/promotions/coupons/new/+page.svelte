<script lang="ts">
	import { adminState } from '$lib/states/adminState.svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Form from '$lib/components/ui/form';
	import * as Select from '$lib/components/ui/select';
	import { ArrowLeft } from 'lucide-svelte';

	let formData = {
		code: '',
		type: 'percentage',
		value: '',
		minOrderValue: '',
		maxDiscount: '',
		usageLimit: '',
		startDate: '',
		endDate: '',
		description: '',
		applicableCategories: [] as string[],
		applicableVendors: [] as string[],
		firstOrderOnly: false,
		minOrderCount: ''
	};

	function handleSubmit() {
		// In real app, call adminState.createCoupon
		console.log('Creating coupon:', formData);
	}
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<div class="space-y-1">
			<h2 class="text-2xl font-bold">Create New Coupon</h2>
			<p class="text-muted-foreground">Set up a new promotional code</p>
		</div>
		<Button variant="outline" onclick={() => history.back()}>
			<ArrowLeft class="mr-2 h-4 w-4" />
			Back
		</Button>
	</div>

	<form on:submit|preventDefault={handleSubmit} class="space-y-6">
		<!-- Basic Information -->
		<Card class="p-6">
			<h3 class="mb-6 font-semibold">Basic Information</h3>
			<div class="grid gap-6">
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label for="code">Coupon Code</Label>
						<Input
							id="code"
							bind:value={formData.code}
							placeholder="e.g. WELCOME50"
							required
							class="uppercase"
						/>
					</div>
					<div class="space-y-2">
						<Label for="type">Discount Type</Label>
						<!-- <Select.Root bind:value={formData.type}>
							<Select.Trigger class="w-full">
								<Select.Value placeholder="Select discount type" />
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="percentage">Percentage Discount</Select.Item>
								<Select.Item value="fixed">Fixed Amount</Select.Item>
							</Select.Content>
						</Select.Root> -->
					</div>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label for="value">Discount Value</Label>
						<Input
							id="value"
							type="number"
							bind:value={formData.value}
							placeholder={formData.type === 'percentage' ? 'Enter percentage' : 'Enter amount'}
							required
						/>
					</div>
					<div class="space-y-2">
						<Label for="maxDiscount">Maximum Discount</Label>
						<Input
							id="maxDiscount"
							type="number"
							bind:value={formData.maxDiscount}
							placeholder="Enter max discount amount"
						/>
					</div>
				</div>

				<div class="space-y-2">
					<Label for="description">Description</Label>
					<Textarea
						id="description"
						bind:value={formData.description}
						placeholder="Enter coupon description"
						required
					/>
				</div>
			</div>
		</Card>

		<!-- Usage Rules -->
		<Card class="p-6">
			<h3 class="mb-6 font-semibold">Usage Rules</h3>
			<div class="grid gap-6">
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label for="minOrderValue">Minimum Order Value</Label>
						<Input
							id="minOrderValue"
							type="number"
							bind:value={formData.minOrderValue}
							placeholder="Enter minimum order value"
							required
						/>
					</div>
					<div class="space-y-2">
						<Label for="usageLimit">Usage Limit</Label>
						<Input
							id="usageLimit"
							type="number"
							bind:value={formData.usageLimit}
							placeholder="Enter total usage limit"
							required
						/>
					</div>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label for="startDate">Start Date</Label>
						<Input id="startDate" type="datetime-local" bind:value={formData.startDate} required />
					</div>
					<div class="space-y-2">
						<Label for="endDate">End Date</Label>
						<Input id="endDate" type="datetime-local" bind:value={formData.endDate} required />
					</div>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label>Applicable Categories</Label>
						<!-- <Select.Root multiple bind:value={formData.applicableCategories}>
							<Select.Trigger class="w-full">
								<Select.Value
									placeholder={formData.applicableCategories.length
										? `${formData.applicableCategories.length} categories selected`
										: 'Select categories'}
								/>
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="restaurant">Restaurant</Select.Item>
								<Select.Item value="grocery">Grocery</Select.Item>
								<Select.Item value="pharmacy">Pharmacy</Select.Item>
								<Select.Item value="electronics">Electronics</Select.Item>
							</Select.Content>
						</Select.Root> -->
					</div>
					<div class="space-y-2">
						<Label>Applicable Vendors</Label>
						<!-- <Select.Root multiple bind:value={formData.applicableVendors}>
							<Select.Trigger class="w-full">
								<Select.Value
									placeholder={formData.applicableVendors.length
										? `${formData.applicableVendors.length} vendors selected`
										: 'Select vendors'}
								/>
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="vendor1">Vendor 1</Select.Item>
								<Select.Item value="vendor2">Vendor 2</Select.Item>
								<Select.Item value="vendor3">Vendor 3</Select.Item>
							</Select.Content>
						</Select.Root> -->
					</div>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="flex items-center gap-2">
						<input type="checkbox" id="firstOrderOnly" bind:checked={formData.firstOrderOnly} />
						<Label for="firstOrderOnly">First Order Only</Label>
					</div>
					{#if !formData.firstOrderOnly}
						<div class="space-y-2">
							<Label for="minOrderCount">Minimum Previous Orders</Label>
							<Input
								id="minOrderCount"
								type="number"
								bind:value={formData.minOrderCount}
								placeholder="Enter minimum order count"
							/>
						</div>
					{/if}
				</div>
			</div>
		</Card>

		<div class="flex justify-end gap-4">
			<Button type="button" variant="outline" onclick={() => history.back()}>Cancel</Button>
			<Button type="submit">Create Coupon</Button>
		</div>
	</form>
</div>
