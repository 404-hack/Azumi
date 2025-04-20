<script lang="ts">
	import { Dialog as DialogPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import X from 'lucide-svelte/icons/x';
	import type { Snippet } from 'svelte';
	import * as Dialog from './index.js';
	import { cn } from '$lib/utils.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { fly } from 'svelte/transition';

	type TransitionConfig = {
		duration: number;
		y: number;
		[key: string]: any;
	};

	let {
		ref = $bindable(null),
		class: className,
		portalProps,
		children,
		scrollClass,
		...restProps
	}: WithoutChildrenOrChild<DialogPrimitive.ContentProps> & {
		portalProps?: DialogPrimitive.PortalProps;
		children: Snippet;
		scrollClass?:string
		
	} = $props();
</script>

<Dialog.Portal {...portalProps}>
	<Dialog.Overlay />

	<DialogPrimitive.Content
		bind:ref
		forceMount
		class={cn(
			' fixed  bottom-0 left-0 z-50   grid h-fit  w-full  gap-4 rounded-t-lg  border-0 bg-background   shadow-lg sm:left-[50%] sm:top-[50%] sm:w-full sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg',
			className
		)}
		{...restProps}
	>
		{#snippet child({ props, open })}
			{#if open}
				<div {...props} transition:fly={{ duration: 200, y: 300 }}>
					<ScrollArea class={cn("max-h-[90vh] w-full p-5   ",scrollClass)}>
						<div class="">
							{@render children?.()}
						</div>
					</ScrollArea>
				</div>
				s
			{/if}
		{/snippet}

		<DialogPrimitive.Close
			class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
		>
			<X class="size-4" />
			<span class="sr-only">Close</span>
		</DialogPrimitive.Close>
	</DialogPrimitive.Content>
</Dialog.Portal>
