<script lang="ts">
	import { Clock, Calendar, Clock4, Settings, Save, Plus, X } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { client } from '$lib/hc';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import * as Form from '$lib/components/ui/form';

	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { updateShopSchema } from '@repo/server/validations';
	import StoreOperationForm from './StoreOperationForm.svelte';
	import StoreHoursForm from './StoreHoursForm.svelte';
	let { data } = $props();
	let isOpen = $state(data.profile.active ?? false); // Store status (open/closed)
	let automaticStatus = $state(false);
	let deliveryType = $state('instant'); // 'instant' or 'preorder'

	async function updateStoreStatus() {
		// Here you would typically update the store status in your backend
		console.log('🚀 ~ updateStoreStatus ~ isOpen:', isOpen);
		toast.success(`Store is now ${isOpen ? 'open' : 'closed'}`);
		await client.vendor.$patch({
			json: {
				active: isOpen
			}
		});
		// await invalidateAll();
	}

	function saveOperatingHours() {
		// Here you would typically save the operating hours to your backend
		console.log('Default schedule:', defaultSchedule);
		console.log('Specific days:', specificDays);
		console.log('Delivery type:', deliveryType);
	}
	const deliveryTypeForm = superForm(
		defaults({ deliveryType: data.profile.deliveryType }, zod(updateShopSchema)),
		{
			validators: zod(updateShopSchema),
			SPA: true,
			onUpdate: async ({ form }) => {
				if (form.valid) {
					const res = await client.vendor.$patch({
						json: {
							deliveryType: form.data.deliveryType
						}
					});
					if (res.ok) {
						toast.success('Delivery type updated successfully');
						await invalidateAll();
					}
				}
			}
		}
	);
	const {
		form: deliveryTypeFormData,
		enhance: deliveryTypeFormEnhance,
		delayed: deliveryTypeFormDelayed
	} = deliveryTypeForm;
</script>

<div class="container mx-auto space-y-6 p-4">
	<h1 class="text-3xl font-bold">Store Operations</h1>

	<div class="grid gap-6 md:grid-cols-1">
		<!-- Store Status Card -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center">
					<Clock class="mr-2 h-5 w-5" />
					Current Store Status
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<div>
							<Label>Store Status</Label>
							<p class="text-sm text-muted-foreground">
								Toggle to change your store's availability
							</p>
						</div>
						<Switch
							bind:checked={isOpen}
							onCheckedChange={updateStoreStatus}
							class="flex items-center justify-between"
						/>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Operating Hours Card -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center">
				<Clock class="mr-2 h-5 w-5" />
				Operating Hours
			</Card.Title>
			<Card.Description>Set your regular business hours for each day of the week</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="space-y-6">
				<!-- Delivery Type Selection -->
				<form class="mb-6" use:deliveryTypeFormEnhance>
					<Form.Field form={deliveryTypeForm} name="deliveryType">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Delivery Type</Form.Label>
								<!-- onValueChange={(value) => ($deliveryTypeFormData.deliveryType = value)} -->
								<Select.Root
									type="single"
									bind:value={$deliveryTypeFormData.deliveryType}
									name={props.name}
								>
									<Select.Trigger {...props}>
										{$deliveryTypeFormData.deliveryType
											? $deliveryTypeFormData.deliveryType
											: 'Select Delivery Type'}
									</Select.Trigger>
									<Select.Content>
										<Select.Group>
											<Select.Item value="INSTANT">Instant Delivery</Select.Item>
											<Select.Item value="PRE_ORDER">Pre-Order</Select.Item>
										</Select.Group>
									</Select.Content>
								</Select.Root>
							{/snippet}
						</Form.Control>
						<Form.Description>Select the delivery type for your store</Form.Description>
						<Form.FieldErrors />
					</Form.Field>
					<div class="mt-4 flex justify-end">
						<Button type="submit" disabled={$deliveryTypeFormDelayed}>
							{#if $deliveryTypeFormDelayed}
								Saving...
							{:else}
								Update Delivery Type
							{/if}
						</Button>
					</div>
				</form>
				<StoreHoursForm schedule={data.profile.operatingHours} />
				<!-- Operating Hours Form -->
			</div>
		</Card.Content>
	</Card.Root>
</div>
