declare namespace google {
	namespace maps {
		class LatLng {
			constructor(lat: number, lng: number);
			lat(): number;
			lng(): number;
		}

		class LatLngBounds {
			constructor(sw?: LatLng, ne?: LatLng);
			extend(point: LatLng): LatLngBounds;
		}

		namespace places {
			class Autocomplete {
				constructor(inputField: HTMLInputElement, opts?: AutocompleteOptions);
				addListener(eventName: string, handler: Function): void;
				getPlace(): PlaceResult;
			}

			class AutocompleteService {
				constructor();
				getPlacePredictions(
					request: AutocompletionRequest,
					callback: (
						predictions: AutocompletePrediction[] | null,
						status: PlacesServiceStatus
					) => void
				): void;
			}

			class PlacesService {
				constructor(attrContainer: HTMLElement);
				getDetails(
					request: PlaceDetailsRequest,
					callback: (result: PlaceResult | null, status: PlacesServiceStatus) => void
				): void;
			}

			class AutocompleteSessionToken {
				constructor();
			}

			interface AutocompleteOptions {
				bounds?: LatLngBounds;
				componentRestrictions?: ComponentRestrictions;
				placeIdOnly?: boolean;
				strictBounds?: boolean;
				types?: string[];
			}

			interface AutocompletePrediction {
				description: string;
				matched_substrings: PredictionSubstring[];
				place_id: string;
				reference: string;
				structured_formatting: StructuredFormatting;
				terms: PredictionTerm[];
				types: string[];
			}

			interface PredictionTerm {
				offset: number;
				value: string;
			}

			interface PredictionSubstring {
				length: number;
				offset: number;
			}

			interface StructuredFormatting {
				main_text: string;
				main_text_matched_substrings: PredictionSubstring[];
				secondary_text: string;
			}

			interface AutocompletionRequest {
				bounds?: LatLngBounds;
				componentRestrictions?: ComponentRestrictions;
				input: string;
				location?: LatLng;
				offset?: number;
				radius?: number;
				sessionToken?: AutocompleteSessionToken;
				types?: string[];
			}

			interface ComponentRestrictions {
				country: string | string[];
			}

			enum PlacesServiceStatus {
				OK,
				ZERO_RESULTS,
				OVER_QUERY_LIMIT,
				REQUEST_DENIED,
				INVALID_REQUEST,
				UNKNOWN_ERROR,
				NOT_FOUND
			}

			interface PlaceDetailsRequest {
				placeId: string;
				fields?: string[];
				sessionToken?: AutocompleteSessionToken;
			}

			interface PlaceResult {
				address_components?: AddressComponent[];
				adr_address?: string;
				formatted_address?: string;
				geometry?: PlaceGeometry;
				icon?: string;
				name?: string;
				permanently_closed?: boolean;
				photos?: PlacePhoto[];
				place_id?: string;
				plus_code?: PlusCode;
				types?: string[];
				url?: string;
				utc_offset?: number;
				vicinity?: string;
				website?: string;
			}

			interface AddressComponent {
				long_name: string;
				short_name: string;
				types: string[];
			}

			interface PlaceGeometry {
				location: LatLng;
				viewport: LatLngBounds;
			}

			interface PlacePhoto {
				height: number;
				html_attributions: string[];
				width: number;
				getUrl(opts: PhotoOptions): string;
			}

			interface PhotoOptions {
				maxHeight?: number;
				maxWidth?: number;
			}

			interface PlusCode {
				compound_code: string;
				global_code: string;
			}
		}

		namespace event {
			function clearInstanceListeners(instance: any): void;
		}
	}
}
