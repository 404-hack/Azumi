<script lang="ts">
	import { goto } from '$app/navigation';
	import { Badge } from '$lib/components/ui/badge';
	import { get } from 'svelte/store';

	export let background_logo: string =
		'https://consumer-static-assets.wolt.com/frontpage-assets/hero-images/5_Friday.jpg';
	export let name: string = 'the bun shop';
	export let description: string = 'this is the bun shop, where you would get all your bun needs';
	export let slug: string;
	export let store_type: string = 'store';
</script>

<a href="/store/{slug}" class="relative overflow-hidden rounded-lg">
	<img
		src={background_logo}
		loading="lazy"
		class="h-52 w-full rounded-md bg-gray-100 object-cover"
		alt=""
	/>
	<div class="bg-background p-2">
		<h1 class="truncate py-1 text-base font-medium capitalize md:text-lg">{name}</h1>
		<p class="truncate text-xs capitalize text-muted-foreground md:text-sm">
			{description}
		</p>
	</div>
	<!-- <Badge variant="secondary" class="absolute top-[180px] capitalize right-2  ">free delivery</Badge> -->
</a>
