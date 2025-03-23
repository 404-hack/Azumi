import { Loader } from '@googlemaps/js-api-loader';

export interface PlaceResult {
	name: string;
	address: string;
	lat: number;
	lng: number;
}

export interface PlacePrediction {
	description: string;
	placeId: string;
}

type PlacesCallback = (place: PlaceResult | null) => void;
type PredictionsCallback = (predictions: PlacePrediction[]) => void;

interface PlacesAutocompleteOptions {
	apiKey: string;
	onPlaceSelect?: PlacesCallback;
	onPredictionsChanged?: PredictionsCallback;
	componentRestrictions?: {
		country: string | string[];
	};
	useCustomUI?: boolean;
}

export function usePlacesAutocomplete(node: HTMLInputElement, options: PlacesAutocompleteOptions) {
	const {
		apiKey,
		onPlaceSelect,
		componentRestrictions,
		onPredictionsChanged,
		useCustomUI = false
	} = options;
	let autocomplete: google.maps.places.Autocomplete | null = null;
	let placesService: google.maps.places.PlacesService | null = null;
	let autocompleteService: google.maps.places.AutocompleteService | null = null;
	let sessionToken: google.maps.places.AutocompleteSessionToken | null = null;

	const initAutocomplete = async () => {
		try {
			// Load the Maps JavaScript API
			const loader = new Loader({
				apiKey,
				version: 'weekly',
				libraries: ['places']
			});
			await loader.load();

			// Create a dummy element for PlacesService (required but not used in the UI)
			if (useCustomUI) {
				const dummyElement = document.createElement('div');
				placesService = new google.maps.places.PlacesService(dummyElement);
				autocompleteService = new google.maps.places.AutocompleteService();
				sessionToken = new google.maps.places.AutocompleteSessionToken();

				// Add input event listener for custom UI
				node.addEventListener('input', debounce(handleInput, 300));
			} else {
				// Initialize the autocomplete with just the geocode type (default Google UI)
				autocomplete = new google.maps.places.Autocomplete(node, {
					types: ['geocode'],
					componentRestrictions
				});

				// Add listener for place selection
				autocomplete.addListener('place_changed', () => {
					const place = autocomplete?.getPlace();
					if (!place?.geometry || !place.geometry.location) return;

					const placeResult: PlaceResult = {
						name: place.name || '',
						address: place.formatted_address || '',
						lat: place.geometry.location.lat(),
						lng: place.geometry.location.lng()
					};

					onPlaceSelect?.(placeResult);
				});
			}
		} catch (err) {
			console.error('Error initializing Places Autocomplete:', err);
		}
	};

	const handleInput = () => {
		const input = node.value;
		if (!input || input.length < 3 || !autocompleteService) {
			onPredictionsChanged?.([]);
			return;
		}

		const request = {
			input,
			types: ['geocode'],
			componentRestrictions,
			sessionToken
		};

		autocompleteService.getPlacePredictions(request, (predictions, status) => {
			if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
				onPredictionsChanged?.([]);
				return;
			}

			const formattedPredictions: PlacePrediction[] = predictions.map((prediction) => ({
				description: prediction.description,
				placeId: prediction.place_id
			}));

			onPredictionsChanged?.(formattedPredictions);
		});
	};

	// Function to fetch details when a place is selected from custom UI
	const getPlaceDetails = (placeId: string) => {
		if (!placesService) return;

		// Create a new session token for each getDetails call
		sessionToken = new google.maps.places.AutocompleteSessionToken();

		placesService.getDetails(
			{
				placeId,
				fields: ['name', 'formatted_address', 'geometry'],
				sessionToken
			},
			(place, status) => {
				if (status !== google.maps.places.PlacesServiceStatus.OK || !place || !place.geometry) {
					onPlaceSelect?.(null);
					return;
				}

				const placeResult: PlaceResult = {
					name: place.name || '',
					address: place.formatted_address || '',
					lat: place.geometry.location.lat(),
					lng: place.geometry.location.lng()
				};

				onPlaceSelect?.(placeResult);
			}
		);
	};

	initAutocomplete();

	// Simple debounce function
	function debounce(func: Function, wait: number) {
		let timeout: ReturnType<typeof setTimeout>;
		return function executedFunction(...args: any[]) {
			const later = () => {
				clearTimeout(timeout);
				func(...args);
			};
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
		};
	}

	return {
		destroy() {
			if (autocomplete) {
				google.maps.event.clearInstanceListeners(autocomplete);
			}
			if (useCustomUI) {
				node.removeEventListener('input', handleInput);
			}
		},
		getPlaceDetails
	};
}
