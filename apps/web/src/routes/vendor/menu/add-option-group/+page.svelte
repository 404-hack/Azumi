<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Plus, GripVertical, X } from 'lucide-svelte';
	import * as Form from '$lib/components/ui/form';
	import { Switch } from '$lib/components/ui/switch';
	import { defaults, superForm } from 'sveltekit-superforms/client';
	import { zod } from 'sveltekit-superforms/adapters';
	import { createOptionGroupSchema } from '@repo/server/validations';

	let { data } = $props();
	const form = superForm(defaults(zod(createOptionGroupSchema)));
	const { form: formData, errors: formErrors, enhance } = form;

	function addOption() {
		$formData.options = [...$formData.options, { name: '', price: 0 }];
	}

	function removeOption(index: number) {
		$formData.options = $formData.options.filter((_, i) => i !== index);
	}
</script>

<div class="container max-w-2xl py-10">
	<div class="mb-8">
		<h1 class="text-3xl font-bold">Add Option Group</h1>
		<p class="text-muted-foreground">Create a new group of options for your menu items</p>
	</div>

	<form use:enhance class="space-y-8">
		<Card.Root>
			<Card.Header>
				<Card.Title>Group Details</Card.Title>
				<Card.Description>Basic information about your option group</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-6">
				<Form.Field {form} name="name">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Group Name</Form.Label>
							<Input
								{...props}
								bind:value={$formData.name}
								placeholder="e.g., Size, Toppings, Spice Level"
							/>
						{/snippet}
					</Form.Control>
					<Form.Description>The name of your option group</Form.Description>
					<Form.FieldErrors />
				</Form.Field>

				<div class="space-y-4">
					<div class="grid gap-4 sm:grid-cols-2">
						<Form.Field {form} name="minSelections">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Minimum Selections</Form.Label>
									<Input
										{...props}
										type="number"
										min="0"
										disabled={!$formData.required}
										bind:value={$formData.minSelections}
									/>
								{/snippet}
							</Form.Control>
							<Form.Description>Minimum number of options required</Form.Description>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Field {form} name="maxSelections">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Maximum Selections</Form.Label>
									<Input {...props} type="number" min="1" bind:value={$formData.maxSelections} />
								{/snippet}
							</Form.Control>
							<Form.Description>Maximum number of options allowed</Form.Description>
							<Form.FieldErrors />
						</Form.Field>
					</div>
				</div>

				<Form.Field {form} name="options">
					<Form.Control>
						{#snippet children({ props })}
							<div class="flex items-center justify-between">
								<div>
									<Form.Label>Options</Form.Label>
									<Form.Description>Add options for this group</Form.Description>
								</div>
								<Button type="button" variant="outline" size="sm" onclick={addOption}>
									<Plus class="mr-2 h-4 w-4" />
									Add Option
								</Button>
							</div>

							<div class="space-y-4">
								{#each $formData.options as option, i}
									<div class="flex items-center gap-4">
										<GripVertical class="h-4 w-4 text-muted-foreground" />
										<div class="grid flex-1 gap-4 sm:grid-cols-2">
											<Form.Field {form} name="name">
												<Form.Control>
													{#snippet children({ props })}
														<Form.Label>Name</Form.Label>
														<Input {...props} bind:value={option.name} placeholder="Option name" />
													{/snippet}
												</Form.Control>
												<Form.FieldErrors />
											</Form.Field>

											<Form.Field {form} name="minSelections">
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
																bind:value={option.price}
															/>
														</div>
													{/snippet}
												</Form.Control>
												<Form.FieldErrors />
											</Form.Field>
										</div>
										{#if $formData.options.length > 1}
											<Button
												type="button"
												variant="ghost"
												size="icon"
												class="text-muted-foreground hover:text-destructive"
												onclick={() => removeOption(i)}
											>
												<X class="h-4 w-4" />
											</Button>
										{/if}
									</div>
								{/each}
							</div>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</Card.Content>
			<Card.Footer>
				<div class="flex justify-end gap-4">
					<Button variant="outline" type="button">Cancel</Button>
					<Button type="submit">Create Group</Button>
				</div>
			</Card.Footer>
		</Card.Root>
	</form>
</div>
