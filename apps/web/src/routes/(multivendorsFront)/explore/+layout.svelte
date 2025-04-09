<script lang="ts">
	import { cn } from '$lib/utils';
	import { Store, Utensils } from 'lucide-svelte';
	import { page } from '$app/state';
	let routes = [
		{
			name: 'stores',
			href: '/explore/stores',
			icon: Store
		}
	];
	let { children } = $props();
</script>

<div class="mx-auto my-6 flex w-fit items-center gap-2 rounded-lg bg-muted px-2 py-1.5">
	{#each routes as { href, name, icon }}
		<a
			{href}
			class={cn('   flex gap-1 rounded-3xl p-2 capitalize text-muted-foreground ', {
				'bg-white font-medium  text-black': href === $page.url.pathname
			})}
		>
			<svelte:component this={icon} />
			<span> {name} </span>
		</a>
	{/each}
</div>
<div class="mx-auto mt-5 max-w-6xl px-5">
	{@render children?.()}
</div>
