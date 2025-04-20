<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import type { Snippet } from 'svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	type Props = {
		open?: boolean;
		title: string;
		description?: string;
		children: Snippet;
	};
	let { children, open = $bindable(), title, description }: Props = $props();
	const isDesktop = new MediaQuery('(min-width: 768px)');
	let activeSnapPoint = $state(148);
</script>

<Dialog.Root bind:open>
	<Dialog.Content class=" pt-7 sm:max-w-[425px]  ">
		<Dialog.Header>
			<Dialog.Title>{title}</Dialog.Title>
			<Dialog.Description>
				{description}
			</Dialog.Description>
		</Dialog.Header>
		<!-- <ScrollArea class= "max-h-[90vh]  w-fit "> -->
		<div class="p-1">
			{@render children()}
		</div>
		<!-- </ScrollArea> -->
	</Dialog.Content>
</Dialog.Root>
