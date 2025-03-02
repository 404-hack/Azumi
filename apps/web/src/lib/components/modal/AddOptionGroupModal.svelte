<script lang="ts">
	import { addPackSchema } from '$lib/formSchema';
	import { addOptionGroupModalState } from '$lib/states/modalState.svelte';
	import ResponsiveDialog from '../ResponsiveDialog.svelte';
	import Button from '../ui/button/button.svelte';
	import Checkbox from '../ui/checkbox/checkbox.svelte';
	import Label from '../ui/label/label.svelte';
	import Input from '../ui/input/input.svelte';
	import { Plus, X } from 'lucide-svelte';

	let groups = [{ name: '', selected: false }];

	function addGroup() {
		groups = [...groups, { name: '', selected: false }];
	}

	function removeGroup(index: number) {
		groups = groups.filter((_, i) => i !== index);
	}

	function handleSubmit() {
		const selectedGroups = groups.filter((g) => g.selected && g.name.trim());
		// Handle submission
		addOptionGroupModalState.value = false;
	}
</script>

<ResponsiveDialog title="Add Option Groups" bind:open={addOptionGroupModalState.value}>
	<form class="grid gap-6" on:submit|preventDefault={handleSubmit}>
		<div class="space-y-4">
			{#each groups as group, i}
				<div class="flex items-center gap-4">
					<Checkbox bind:checked={groups[i].selected} id={`group-{i}`} aria-label="Select group" />
					<Input bind:value={groups[i].name} placeholder="Enter group name" class="flex-1" />
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onclick={() => removeGroup(i)}
						class="h-9 w-9"
					>
						<X class="h-4 w-4" />
					</Button>
				</div>
			{/each}
		</div>

		<div class="flex flex-col gap-4">
			<Button type="button" variant="outline" class="w-full" onclick={addGroup}>
				<Plus class="mr-2 h-4 w-4" />
				Add New Group
			</Button>

			<Button type="submit" class="w-full">Save Groups</Button>
		</div>
	</form>
</ResponsiveDialog>
