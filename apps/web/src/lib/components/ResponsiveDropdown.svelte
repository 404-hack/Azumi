<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Drawer from '$lib/components/ui/drawer';
	import { Button } from '$lib/components/ui/button';
	import type { Snippet } from 'svelte';

	type Props = {
		trigger: Snippet;
		children: Snippet;
		align?: 'start' | 'end' | 'center';
	};

	let { trigger, children, align = 'end' }: Props = $props();
	let open = $state(false);
	const isDesktop = new MediaQuery('(min-width: 768px)');

	function createMenuItem(props: Record<string, unknown>) {
		return {
			props: {
				class:
					'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
				...props
			}
		};
	}
</script>

{#if isDesktop.current}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{@render trigger()}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content {align} class="w-56">
			{@render children()}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{:else}
	<div>
		<div on:click={() => (open = true)}>
			{@render trigger()}
		</div>
		<Drawer.Root bind:open shouldScaleBackground>
			<Drawer.Content>
				<div class="mx-auto w-full max-w-sm">
					<div class="p-4">
						<div class="space-y-1">
							{#snippet mobileChildren()}
								{@render children()}
							{/snippet}
							{@render mobileChildren()}
						</div>
					</div>
					<Drawer.Footer class="mt-4">
						<Drawer.Close>
							<Button variant="outline" class="w-full">Close</Button>
						</Drawer.Close>
					</Drawer.Footer>
				</div>
			</Drawer.Content>
		</Drawer.Root>
	</div>
{/if}

<style>
	:global(.dropdown-menu-item) {
		@apply relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50;
	}

	:global(.dropdown-menu-item.destructive) {
		@apply text-destructive hover:bg-destructive hover:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground;
	}

	:global(.dropdown-menu-separator) {
		@apply -mx-1 my-1 h-px bg-muted;
	}
</style>
