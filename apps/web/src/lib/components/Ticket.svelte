<script lang="ts">
	import { ChevronRight, Sparkles } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';

	export let className = '';
</script>

<div
	class={cn(
		'group relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md sm:w-fit',
		className
	)}
>
	<!-- Gradient background -->
	<div
		class="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 transition-opacity group-hover:opacity-80"
	/>

	<!-- Left cutout -->
	<div
		class="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background shadow-inner"
	/>
	<!-- Right cutout -->
	<div
		class="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background shadow-inner"
	/>

	<!-- Dashed line -->
	<div
		class="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 border-t border-dashed border-primary/20"
	/>

	<div class="relative flex items-center gap-4">
		<div
			class="flex items-center justify-center rounded-full bg-primary p-2 shadow-sm transition-all group-hover:-rotate-12 group-hover:scale-110"
		>
			<Sparkles class="h-4 w-4 text-primary-foreground" />
		</div>
		<div class="flex flex-col">
			<span class="text-sm font-semibold">AMO+</span>
			<span class="text-sm text-muted-foreground">Free delivery & exclusive deals</span>
		</div>
	</div>

	<Button variant="ghost" class="relative ml-4 gap-2 px-4 group-hover:text-primary">
		<span class="font-medium">Subscribe</span>
		<ChevronRight class="h-4 w-4 transition-transform group-hover:translate-x-1" />
	</Button>
</div>
