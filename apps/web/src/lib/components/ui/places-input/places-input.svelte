<script lang="ts">
	import { PUBLIC_GOOGLE_MAP_API_KEY } from '$env/static/public';
	import { usePlacesAutocomplete, type PlacePrediction } from '$lib/actions/places-autocomplete';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';
	import { onMount } from 'svelte';
	import { MapPin } from 'lucide-svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';

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
	let open = $derived.by(() => isFocused && predictions.length > 0);
	let highlightedIndex = $state(-1);

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

	function handleKeyDown(event: KeyboardEvent) {
		if (!isFocused || predictions.length === 0) return;

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				highlightedIndex = (highlightedIndex + 1) % predictions.length;
				break;
			case 'ArrowUp':
				event.preventDefault();
				highlightedIndex = (highlightedIndex - 1 + predictions.length) % predictions.length;
				break;
			case 'Enter':
				event.preventDefault();
				if (highlightedIndex >= 0 && highlightedIndex < predictions.length) {
					handlePredictionSelect(predictions[highlightedIndex]);
				} else if (predictions.length > 0) {
					handlePredictionSelect(predictions[0]);
				}
				break;
			case 'Escape':
				predictions = [];
				break;
		}
	}

	$effect(() => {
		if (!isFocused) highlightedIndex = -1;
	});

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
		onfocus={handleInputFocus}
		onblur={handleInputBlur}
		onkeydown={handleKeyDown}
		role="combobox"
		aria-autocomplete="list"
		aria-expanded={predictions.length > 0 && isFocused}
		aria-controls="places-listbox"
		aria-activedescendant={highlightedIndex >= 0 ? `places-option-${highlightedIndex}` : undefined}
		{...restProps}
	/>
</div>
{#if predictions.length > 0 && isFocused}
	<div
		class="absolute top-10 z-50 mt-1 w-full rounded-md border border-input bg-background shadow-md"
	>
		<ul id="places-listbox" class="max-h-[300px] overflow-auto py-1 text-sm" role="listbox">
			{#each predictions as prediction, i}
				<div
					class={cn(
						'flex cursor-pointer items-start gap-2 px-3 py-2 hover:bg-muted',
						highlightedIndex === i ? 'bg-muted' : ''
					)}
					id={`places-option-${i}`}
					role="option"
					aria-selected={highlightedIndex === i}
					onmousedown={() => handlePredictionSelect(prediction)}
					tabindex="-1"
				>
					<MapPin class="mt-0.5 h-4 w-4 shrink-0" />
					<span>{prediction.description}</span>
				</div>
			{/each}
		</ul>
	</div>
{/if}
