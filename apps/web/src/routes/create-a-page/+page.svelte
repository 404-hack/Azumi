<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Card from '$lib/components/ui/card';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod, zodClient } from 'sveltekit-superforms/adapters';
	import * as Select from '$lib/components/ui/select';
	import { Badge } from '$lib/components/ui/badge';
	import { Loader, Store } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client.js';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';
	import {} from '@repo/server/hc';
	import { createShopSchema } from '@repo/server/validations';
	import { client } from '$lib/hc.js';
	let { data } = $props();
	const form = superForm(defaults(zod(createShopSchema)), {
		validators: zod(createShopSchema),
		SPA: true,
		onUpdate: async ({ form }) => {
			
			if (form.valid) {
				const res = await client.shop.create.$post({
					json: {
						name: form.data.name,
						type: form.data.type,
						email: form.data.email,
						phone: form.data.phone,
						address: form.data.address,
					}
				});
				if(res.ok){
					await goto('/create-a-page/application-sent')
				}else{
					toast.error('An error occurred while creating your store. Please try again later.')
				}
			}
		}
	});

	const { form: formData, enhance, delayed } = form;
</script>

<div class="container mx-auto max-w-3xl px-4 py-12">
	<div class="mb-10 text-center">
		<Store class="mx-auto mb-6 size-16 text-primary" />
		<h1 class="font-display text-4xl font-bold tracking-tight md:text-5xl">Create Your Store</h1>
		<p class="mt-3 text-lg text-muted-foreground">
			Join our marketplace and start selling to customers across Africa
		</p>
	</div>

	<form use:enhance class="space-y-8">
		<Card.Root>
			<Card.Header>
				<Card.Title>Store Information</Card.Title>
				<Card.Description>Tell us about your business</Card.Description>
			</Card.Header>

			<Card.Content class="space-y-6">
				<Form.Field {form} name="name">
					<Form.Control>
						{#snippet children({ props })}
							<div class="space-y-2">
								<Form.Label>Store Name</Form.Label>
								<Input
									{...props}
									bind:value={$formData.name}
									placeholder="Enter your store name"
								/>
								<Form.Description>This is how customers will identify your store</Form.Description>
							</div>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="type">
					<Form.Control>
						{#snippet children({ props })}
							<div class="space-y-2">
								<Form.Label>Business Type</Form.Label>
								<Select.Root bind:value={$formData.type} type="single" name={props.name}>
									<Select.Trigger {...props} class="w-full">
										<span class="">
											{data.shopTypes.find((shopType) => shopType.id === $formData.type)
												?.name || 'Select business type'}
										</span>
									</Select.Trigger>
									<Select.Content>
										{#each data.shopTypes as shopType}
											<Select.Item value={shopType.id} label={shopType.name} />
										{/each}
									</Select.Content>
								</Select.Root>
							</div>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<div class="grid gap-6 md:grid-cols-2">
					<Form.Field {form} name="email">
						<Form.Control>
							{#snippet children({ props })}
								<div class="space-y-2">
									<Form.Label>Email Address</Form.Label>
									<Input
										{...props}
										type="email"
										bind:value={$formData.email}
										placeholder="you@example.com"
									/>
								</div>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name="phone">
						<Form.Control>
							{#snippet children({ props })}
								<div class="space-y-2">
									<Form.Label>Phone Number</Form.Label>
									<Input
										{...props}
										type="tel"
										bind:value={$formData.phone}
										placeholder="+1234567890"
									/>
								</div>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</div>

				<Form.Field {form} name="address">
					<Form.Control>
						{#snippet children({ props })}
							<div class="space-y-2">
								<Form.Label>Business Address</Form.Label>
								<Input
									{...props}
									bind:value={$formData.address}
									placeholder="Enter your business address"
								/>
							</div>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</Card.Content>

			<Card.Footer class="flex flex-col space-y-4">
				<p class="text-xs text-muted-foreground">
					By creating a store, you agree to our Terms of Service and Privacy Policy. You must be at
					least 18 years old to operate a store on our platform.
				</p>
				<Button type="submit" class="w-full">
					{#if $delayed}
						<Loader class="mr-2 size-4 animate-spin" />
						Creating your store...
					{:else}
						Create Store
					{/if}
				</Button>
			</Card.Footer>
		</Card.Root>
	</form>
</div>
