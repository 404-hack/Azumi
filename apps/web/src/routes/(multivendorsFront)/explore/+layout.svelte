<script lang="ts">
	import { cn } from '$lib/utils';
	import { Store, Utensils } from 'lucide-svelte';
	let routes = [
		{
			name: 'stores',
			href: '/explore/stores',
			icon: Store
		}
	];
	let { children } = $props();
</script>

<!-- <div class="w-fit mx-auto bg-muted py-1.5 my-6 rounded-lg flex gap-2 items-center px-2">
	{#each routes as { href, name, icon }}
		<a
			{href}
			class={cn('   gap-1 capitalize rounded-3xl flex p-2 text-muted-foreground ', {
				'text-black bg-white  font-medium': href === $page.url.pathname
			})}
		>
			<svelte:component this={icon} />
			<span> {name} </span>
		</a>
	{/each}
</div> -->
<div class="mx-auto mt-5 max-w-6xl px-5">
	{@render children?.()}
</div>
