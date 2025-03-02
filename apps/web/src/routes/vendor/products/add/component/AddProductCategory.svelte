<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Loader2, Plus } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { productCategorySchema } from '$lib/formSchema';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';

	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	export let productCategoryForm: SuperValidated<Infer<typeof productCategorySchema>>;
	let open = false;

	const form = superForm(productCategoryForm, {
		validators: zodClient(productCategorySchema),
		onUpdated: ({ form: { message, valid } }) => {
			if (message) {
				if (message.type === 'error') {
					toast.error(message.text);
				}
				if (message.type === 'success') {
					toast.success(message.text);
					open = false;
				}
			}
		}
	});

	const { form: formData, enhance, delayed } = form;
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger>
		<Button size="icon" variant="outline">
			<Plus />
		</Button>
	</Dialog.Trigger>
	<Dialog.Content class="w-full p-5">
		<Dialog.Header>
			<Dialog.Title>Add a category?</Dialog.Title>
			<form
				method="POST"
				use:enhance
				action="/seller/products/add?/createProductCategory"
				class=" my-5"
			>
				<Form.Field {form} name="name">
					<Form.Control let:attrs>
						{#snippet children({ props })}
							<div>
								<Form.Label>Name</Form.Label>
								<Input class="w-full" {...props} bind:value={$formData.name} />
							</div>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Button class=""
					>{#if $delayed}
						<Loader2 class="size-6 animate-spin " />
					{:else}
						add category
					{/if}</Form.Button
				>
			</form>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>
