<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import Upload from 'lucide-svelte/icons/upload';
	import { filesProxy } from 'sveltekit-superforms';

	let fileInput: HTMLInputElement;
	export let form: any;
	const files = filesProxy(form, 'media');
</script>

<Card.Root class="overflow-hidden">
	<Card.Header>
		<Card.Title>Product Images</Card.Title>
	</Card.Header>
	<Card.Content>
		<div class="grid gap-2">
			<input
				type="file"
				multiple
				name="images"
				accept="image/png, image/jpeg"
				on:change={(e) => {
					const target = e.currentTarget;
					if (target instanceof HTMLInputElement && target.files) {
						const newFiles = Array.from(target.files);
						$files = Object.assign([...$files, ...newFiles]);
					}
				}}
				bind:this={fileInput}
				hidden
			/>

			{#if $files.length > 0}
				<img
					alt="Product"
					class="aspect-square w-full rounded-md object-cover"
					height="300"
					src={URL.createObjectURL($files[0])}
					width="300"
				/>
				<div class="grid grid-cols-3 gap-2">
					{#each $files as file}
						<img
							alt="Product"
							class="aspect-square w-full rounded-md object-cover"
							height="84"
							src={URL.createObjectURL(file)}
							width="84"
						/>
					{/each}

					<button
						class="flex aspect-square w-full items-center justify-center rounded-md border border-dashed"
						on:click={(e) => {
							e.preventDefault();
							fileInput?.click();
						}}
					>
						<Upload class="h-4 w-4 text-muted-foreground" />

						<span class="sr-only">Upload</span>
					</button>
				</div>
			{/if}
			{#if $files.length === 0}
				<button
					class="flex aspect-square w-full items-center justify-center rounded-md border border-dashed"
					on:click={(e) => {
						e.preventDefault();
						fileInput?.click();
					}}
				>
					<Upload class="h-4 w-4 text-muted-foreground" />

					<span class="sr-only">Upload</span>
				</button>
			{/if}
		</div>
	</Card.Content>
</Card.Root>
