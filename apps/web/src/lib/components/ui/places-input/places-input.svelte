<script lang="ts">
	import { PUBLIC_GOOGLE_MAP_API_KEY } from '$env/static/public';
	import { usePlacesAutocomplete, type PlacePrediction } from '$lib/actions/places-autocomplete';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';
	import { onMount } from 'svelte';
	import { MapPin } from 'lucide-svelte';

	type Place = {
		name: string;
		address: string;
		lat: number;
		lng: number;
	};

	let {
		value = $bindable(''),
		class: className,
		onPlaceSelect = $bindable(undefined),
		...restProps
	} = $props<
		HTMLInputAttributes & {
			onPlaceSelect?: (place: Place) => void;
		}
	>();

	let inputElement: HTMLInputElement;
	let predictions: PlacePrediction[] = $state([]);
	let isFocused = $state(false);
	let placesAction: ReturnType<typeof usePlacesAutocomplete> | null = null;

	function handlePredictionSelect(prediction: PlacePrediction) {
		placesAction?.getPlaceDetails(prediction.placeId);
		predictions = [];
	}

	function handleInputFocus() {
		isFocused = true;
	}

	function handleInputBlur() {
		// Delay hiding predictions to allow for clicking on them
		setTimeout(() => {
			isFocused = false;
		}, 200);
	}

	$effect(() => {
		if (inputElement) {
			placesAction = usePlacesAutocomplete(inputElement, {
				apiKey: PUBLIC_GOOGLE_MAP_API_KEY,
				onPlaceSelect: (place) => {
					if (place && onPlaceSelect) {
						value = place.address;
						predictions = []; // Clear predictions after selection
						onPlaceSelect(place);
					}
				},
				onPredictionsChanged: (newPredictions) => {
					predictions = newPredictions;
				},
				componentRestrictions: { country: 'ng' },
				useCustomUI: true
			});

			return placesAction.destroy;
		}
	});
</script>

<div class="relative w-full">
	<input
		bind:this={inputElement}
		bind:value
		class={cn('flex h-10 w-full rounded-md border border-input px-3 py-2', className)}
		placeholder="Enter a Nigerian address"
		on:focus={handleInputFocus}
		on:blur={handleInputBlur}
		{...restProps}
	/>

	{#if predictions.length > 0 && isFocused}
		<div class="absolute z-50 mt-1 w-full rounded-md border border-input bg-background shadow-md">
			<ul class="max-h-[300px] overflow-auto py-1 text-sm">
				{#each predictions as prediction}
					<li
						class="flex cursor-pointer items-start gap-2 px-3 py-2 hover:bg-muted"
						on:click={() => handlePredictionSelect(prediction)}
					>
						<MapPin class="mt-0.5 h-4 w-4 shrink-0" />
						<span>{prediction.description}</span>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
