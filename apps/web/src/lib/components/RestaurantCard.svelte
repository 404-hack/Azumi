<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import { Clock, Star } from 'lucide-svelte';

	interface RestaurantCardProps {
		name: string;
		image: string;
		rating: number;
		deliveryTime: string;
		tags: string[];
	}

	let { name, image, rating, deliveryTime, tags }: RestaurantCardProps = $props();
</script>

<Card.Root
	class="group relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
>
	<div class="relative aspect-[4/3] overflow-hidden">
		<img
			src={image}
			alt={name}
			class="absolute inset-0 h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
		/>
		<div class="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

		<!-- Delivery Time Badge -->
		<div class="absolute bottom-3 left-3">
			<Badge
				variant="secondary"
				class="flex items-center gap-1 bg-background/90 px-2.5 py-1 text-sm"
			>
				<Clock class="h-3.5 w-3.5" />
				{deliveryTime}
			</Badge>
		</div>
	</div>

	<Card.Content class="p-4">
		<div class="flex items-center justify-between">
			<Card.Title class="text-lg font-semibold">{name}</Card.Title>
			<div
				class="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-sm text-primary"
			>
				<Star class="h-3.5 w-3.5 fill-primary" />
				<span class="font-medium">{rating}</span>
			</div>
		</div>

		<div class="mt-2 flex flex-wrap gap-1.5">
			{#each tags as tag}
				<Badge
					variant="outline"
					class="rounded-full border-primary/20 bg-primary/10 text-xs font-normal text-primary"
				>
					{tag}
				</Badge>
			{/each}
		</div>
	</Card.Content>
</Card.Root>
