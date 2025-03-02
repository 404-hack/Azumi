<script lang="ts">
	import { Plus } from 'lucide-svelte';
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';

	let foodPacks = $state([
		{
			id: 1,
			name: 'Family Feast',
			description: 'Perfect for family gatherings, serves 4-6 people',
			price: 49.99
		},
		{
			id: 2,
			name: 'Date Night Special',
			description: 'Romantic dinner for two with premium selections',
			price: 29.99
		}
	]);
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-semibold">Food Packs</h2>
		<Button>
			<Plus class="mr-2 h-4 w-4" />
			Add Food Pack
		</Button>
	</div>

	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Name</Table.Head>
					<Table.Head>Description</Table.Head>
					<Table.Head>Price</Table.Head>
					<Table.Head class="text-right">Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each foodPacks as pack (pack.id)}
					<Table.Row>
						<Table.Cell class="font-medium">{pack.name}</Table.Cell>
						<Table.Cell>{pack.description}</Table.Cell>
						<Table.Cell>${pack.price}</Table.Cell>
						<Table.Cell class="text-right">
							<div class="flex justify-end gap-2">
								<Button variant="outline" size="sm">Edit</Button>
								<Button variant="destructive" size="sm">Delete</Button>
							</div>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</div>
