<script lang="ts">
	import { ArrowLeft, Loader, Edit2 } from 'lucide-svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import type { PageData } from './$types';
	import { vendorProfileSchema } from '$lib/schemas/vendor';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import Label from '$lib/components/ui/label/label.svelte';

	export let data: PageData;
	const form = superForm(data.form, {
		validators: zodClient(vendorProfileSchema)
	});
	const { form: formData, enhance, delayed } = form;
</script>

<div class="min-h-screen">
	<div class=" mx-auto max-w-4xl">
		<div class="mb-8 flex items-center gap-4">
			<a
				href="/vendor/profile"
				class="group inline-flex items-center rounded-full bg-background p-2 text-sm text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
			>
				<ArrowLeft class="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
				Back
			</a>
			<h2 class="text-2xl font-semibold tracking-tight">Edit Profile</h2>
		</div>

		<form method="POST" use:enhance class="space-y-6">
			<Card.Root class="overflow-hidden bg-background/60  backdrop-blur">
				<Card.Header class="space-y-1 border-b px-6 py-4">
					<Card.Title>Store Information</Card.Title>
					<Card.Description>Update your store's profile and business details</Card.Description>
				</Card.Header>

				<Card.Content class="p-0">
					<!-- Logo Section -->
					<div class="border-b bg-muted/50 p-6">
						<div class="flex flex-col items-center gap-4 sm:flex-row">
							<div class="relative">
								<img
									src={$formData.logo}
									alt="Store Logo"
									class="h-28 w-28 rounded-2xl border-4 border-background object-cover transition-transform hover:scale-105"
								/>
								<Button
									size="icon"
									variant="secondary"
									class="absolute -right-2 -top-2 h-8 w-8 rounded-full"
								>
									<Edit2 class="h-4 w-4" />
								</Button>
							</div>
							<div class="text-center sm:text-left">
								<h3 class="font-medium">Store Logo</h3>
								<p class="text-sm text-muted-foreground">
									Upload a high-quality image to represent your business
								</p>
							</div>
						</div>
					</div>

					<!-- Store Details -->
					<div class="grid gap-6 p-6 md:grid-cols-2">
						<div class="space-y-4">
							<Form.Field {form} name="storeName">
								<Form.Control>
									{#snippet children({ props })}
										<div class="space-y-2">
											<Form.Label>Store Name</Form.Label>
											<Input {...props} bind:value={$formData.storeName} />
										</div>
									{/snippet}
								</Form.Control>
								<Form.FieldErrors class="text-xs" />
							</Form.Field>

							<Form.Field {form} name="description">
								<Form.Control>
									{#snippet children({ props })}
										<div class="space-y-2">
											<Form.Label>Description</Form.Label>
											<Textarea
												class="min-h-[120px] resize-none"
												{...props}
												bind:value={$formData.description}
											/>
										</div>
									{/snippet}
								</Form.Control>
								<Form.FieldErrors class="text-xs" />
							</Form.Field>
						</div>

						<div class="space-y-4">
							<Form.Field {form} name="address">
								<Form.Control>
									{#snippet children({ props })}
										<div class="space-y-2">
											<Form.Label>Address</Form.Label>
											<Input {...props} bind:value={$formData.address} />
										</div>
									{/snippet}
								</Form.Control>
								<Form.FieldErrors class="text-xs" />
							</Form.Field>

							<div class="grid gap-4 md:grid-cols-2">
								<Form.Field {form} name="city">
									<Form.Control>
										{#snippet children({ props })}
											<div class="space-y-2">
												<Form.Label>City</Form.Label>
												<Input {...props} bind:value={$formData.city} />
											</div>
										{/snippet}
									</Form.Control>
									<Form.FieldErrors class="text-xs" />
								</Form.Field>

								<Form.Field {form} name="zipCode">
									<Form.Control>
										{#snippet children({ props })}
											<div class="space-y-2">
												<Form.Label>ZIP Code</Form.Label>
												<Input {...props} bind:value={$formData.zipCode} />
											</div>
										{/snippet}
									</Form.Control>
									<Form.FieldErrors class="text-xs" />
								</Form.Field>
							</div>

							<Form.Field {form} name="phone">
								<Form.Control>
									{#snippet children({ props })}
										<div class="space-y-2">
											<Form.Label>Phone</Form.Label>
											<Input {...props} bind:value={$formData.phone} />
										</div>
									{/snippet}
								</Form.Control>
								<Form.FieldErrors class="text-xs" />
							</Form.Field>
						</div>
					</div>
				</Card.Content>

				<Card.Footer class="border-t bg-muted/50 px-6 py-4">
					<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<Button variant="outline" href="/vendor/profile">Cancel</Button>
						<Button type="submit" class="gap-2">
							{#if $delayed}
								<Loader class="size-4 animate-spin" />
								Saving changes...
							{:else}
								Save Changes
							{/if}
						</Button>
					</div>
				</Card.Footer>
			</Card.Root>
		</form>
	</div>
</div>
