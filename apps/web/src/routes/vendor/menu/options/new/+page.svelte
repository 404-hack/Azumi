<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import * as Select from '$lib/components/ui/select';
	import { Badge } from '$lib/components/ui/badge';
	import { Switch } from '$lib/components/ui/switch';
	import { ArrowLeft } from 'lucide-svelte';
	import { defaults, superForm } from 'sveltekit-superforms/client';
	import { createOptionSchema } from '@repo/server/validations';
	import { zod } from 'sveltekit-superforms/adapters';
	import { client } from '$lib/hc';
	import { goto, invalidateAll } from '$app/navigation';

	const form = superForm(defaults(zod(createOptionSchema)), {
		validators: zod(createOptionSchema),
		SPA: true,
		onUpdate: async ({ form }) => {
			if (form.valid) {
				const res = await client.vendor.option.create.$post({
					json: {
						...form.data
					}
				});
				if (res.ok) {
					const data = await res.json();
					await invalidateAll();
					await goto('/vendor/menu?tabValue=option-items');
				}
			}
		}
	});
	const { form: formData, enhance } = form;
</script>

<div class="container mx-auto max-w-3xl py-6">
	<div class="mb-6">
		<Button variant="ghost" size="icon" href="/vendor/menu" class="mb-4">
			<ArrowLeft class="h-5 w-5" />
		</Button>
		<h1 class="text-2xl font-semibold">Add New Option</h1>
		<p class="text-muted-foreground">Create a new option that can be added to option groups</p>
	</div>

	<form use:enhance class="space-y-8">
		<Card.Root>
			<Card.Header>
				<Card.Title>Option Details</Card.Title>
				<Card.Description>Enter the details for your new option</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-6">
				<Form.Field {form} name="name">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Option Name</Form.Label>
							<Input
								{...props}
								bind:value={$formData.name}
								placeholder="e.g., Extra Cheese, Large Size"
							/>
						{/snippet}
					</Form.Control>
					<Form.Description>The name of your option as it will appear to customers</Form.Description
					>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="price">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Additional Price</Form.Label>
							<div class="relative">
								<span class="absolute left-3 top-2.5 text-muted-foreground">$</span>
								<Input
									{...props}
									type="number"
									min="0"
									step="0.01"
									class="pl-7"
									placeholder="0.00"
									bind:value={$formData.price}
								/>
							</div>
						{/snippet}
					</Form.Control>
					<Form.Description
						>Extra cost when this option is selected (0 for no additional cost)</Form.Description
					>
					<Form.FieldErrors />
				</Form.Field>

				<!-- <Form.Field {form} name="createFromMenuItem">
					<Form.Control>
						{#snippet children({ props })}
							<div class="space-y-2">
								<Form.Label
									>Create from Menu Item <Badge variant="outline">Optional</Badge></Form.Label
								>
								<Select.Root>
									<Select.Trigger>Select menu item</Select.Trigger>
									<Select.Content>
										<Select.Item value="">None</Select.Item>
										<Select.Item value="jollof-rice">Jollof Rice</Select.Item>
										<Select.Item value="fried-rice">Fried Rice</Select.Item>
									</Select.Content>
								</Select.Root>
							</div>
						{/snippet}
					</Form.Control>
					<Form.Description>
						Create this option from an existing menu item (price and details will be copied)
					</Form.Description>
					<Form.FieldErrors />
				</Form.Field> -->

				<Form.Field {form} name="inStock">
					<Form.Control>
						{#snippet children({ props })}
							<div class="flex items-center justify-between">
								<div>
									<Form.Label>Mark as in stock</Form.Label>
									<Form.Description>Make this option available for selection</Form.Description>
								</div>
								<Switch {...props} bind:checked={$formData.inStock} />
							</div>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</Card.Content>
			<Card.Footer>
				<div class="flex justify-end gap-4">
					<Button variant="outline" type="button" href="/vendor/menu">Cancel</Button>
					<Button type="submit">Create Option</Button>
				</div>
			</Card.Footer>
		</Card.Root>
	</form>
</div>
