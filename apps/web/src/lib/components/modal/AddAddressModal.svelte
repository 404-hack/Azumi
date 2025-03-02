<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { buttonVariants } from '../ui/button';
	import * as Form from '$lib/components/ui/form';
	import { Loader2 } from 'lucide-svelte';
	import { defaults, superForm, type Infer } from 'sveltekit-superforms/client';
	import { zod } from 'sveltekit-superforms/adapters';
	import Input from '../ui/input/input.svelte';
	import Button from '../ui/button/button.svelte';
	import ResponsiveDialog from '../ResponsiveDialog.svelte';
	import { addAddressModalState } from '$lib/states/modalState.svelte';
	import { enhance } from '$app/forms';
</script>

<ResponsiveDialog title="Add Address" bind:open={addAddressModalState.value}>
	<form method="POST" use:enhance>
		<Input />

		<Button type="submit" class="mt-3 w-full shadow-md" size="lg">Add address</Button>
	</form>
</ResponsiveDialog>
