<script lang="ts">
	import { ArrowLeft } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Form from '$lib/components/ui/form';
	import { defaults, superForm } from 'sveltekit-superforms/client';
	import { zod } from 'sveltekit-superforms/adapters';
	import { client } from '$lib/hc';
	import { goto, invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { createPackSchema } from '@repo/server/validations';

	// Using the menu pack schema for validation

	const form = superForm(defaults(zod(createPackSchema)), {
		validators: zod(createPackSchema),
		SPA: true,
		onUpdate: async ({ form }) => {
			if (form.valid) {
				try {
					const res = await client.vendor.pack.create.$post({
						json: {
							...form.data
						}
					});
					if (res.ok) {
						const data = await res.json();
						toast.success('Food pack successfully created');
						await invalidateAll();
						await goto('/vendor/menu/?tabValue=food-packs');
					}
				} catch (error) {
					console.error('Failed to create food pack', error);
					toast.error('Failed to create food pack');
				}
			}
		}
	});
	const { form: formData, enhance, delayed } = form;
</script>

<div class="container max-w-3xl py-10">
	<div class="mb-6 flex items-center gap-4">
		<Button variant="ghost" size="icon" href="/vendor/menu?tabValue=food-packs" class="h-8 w-8">
			<ArrowLeft class="h-4 w-4" />
		</Button>
		<div>
			<h1 class="text-2xl font-semibold">Add Food Pack</h1>
			<p class="text-sm text-muted-foreground">
				Create a new food pack to bundle menu items together for special offers
			</p>
		</div>
	</div>

	<form use:enhance class="space-y-8">
		<Card.Root>
			<Card.Header>
				<Card.Title>Pack Details</Card.Title>
				<Card.Description>Enter the basic information for your food pack</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-6">
				<Form.Field {form} name="name">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Pack Name</Form.Label>
							<Input
								{...props}
								bind:value={$formData.name}
								placeholder="e.g., Family Feast, Date Night Special"
							/>
						{/snippet}
					</Form.Control>
					<Form.Description>A clear, descriptive name for your food pack</Form.Description>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="description">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Description</Form.Label>
							<Textarea
								{...props}
								bind:value={$formData.description}
								placeholder="Describe what's included in this pack and who it's perfect for"
								class="min-h-[120px]"
							/>
						{/snippet}
					</Form.Control>
					<Form.Description>Provide details about what makes this pack special</Form.Description>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="price">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Price</Form.Label>
							<div class="relative">
								<span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
								<Input
									{...props}
									type="number"
									min="0"
									step="0.01"
									class="pl-8"
									placeholder="0.00"
									bind:value={$formData.price}
								/>
							</div>
						{/snippet}
					</Form.Control>
					<Form.Description>
						The total price of the pack (should usually offer savings compared to buying items
						separately)
					</Form.Description>
					<Form.FieldErrors />
				</Form.Field>
			</Card.Content>
			<Card.Footer>
				<div class="flex justify-end gap-4">
					<Button variant="outline" type="button" href="/vendor/menu?tabValue=food-packs">
						Cancel
					</Button>
					<Button type="submit" disabled={$delayed}>
						{#if $delayed}
							<span
								class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
							/>
						{/if}
						Create Food Pack
					</Button>
				</div>
			</Card.Footer>
		</Card.Root>
	</form>
</div>
