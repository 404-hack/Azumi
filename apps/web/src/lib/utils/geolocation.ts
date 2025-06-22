export interface Position {
	coords: {
		latitude: number;
		longitude: number;
		accuracy: number;
		altitude: number | null;
		altitudeAccuracy: number | null;
		heading: number | null;
		speed: number | null;
	};
	timestamp: number;
}

interface GoogleGeocodingResponse {
	status: string;
	results?: Array<{
		geometry: {
			location: {
				lat: number;
				lng: number;
			};
		};
		formatted_address: string;
		place_id: string;
		address_components: Array<{
			long_name: string;
			short_name: string;
			types: string[];
		}>;
	}>;
	error_message?: string;
}

interface OpenStreetMapResponse {
	display_name?: string;
	address?: {
		road?: string;
		neighbourhood?: string;
		suburb?: string;
		town?: string;
		city?: string;
		[key: string]: string | undefined;
	};
	error?: string;
	[key: string]: unknown;
}

export function getCurrentPosition(): Promise<Position> {
	return new Promise((resolve, reject) => {
		if (!navigator.geolocation) {
			reject(new Error('Geolocation is not supported by your browser'));
			return;
		}

		let hasReturned = false;
		const timeout = setTimeout(() => {
			if (!hasReturned) {
				hasReturned = true;
				reject(new Error('Location request timed out'));
			}
		}, 15000);
		const options: PositionOptions = {
			enableHighAccuracy: true,
			timeout: 20000,
			maximumAge: 0
		};
		navigator.geolocation.getCurrentPosition(
			(position) => {
				if (hasReturned) return;
				hasReturned = true;
				clearTimeout(timeout);

				if (!position || !position.coords) {
					reject(new Error('Invalid position data received from GPS'));
					return;
				}

				const { coords } = position;

				if (
					typeof coords.latitude !== 'number' ||
					typeof coords.longitude !== 'number' ||
					isNaN(coords.latitude) ||
					isNaN(coords.longitude) ||
					coords.latitude === 0 ||
					coords.longitude === 0 ||
					Math.abs(coords.latitude) > 90 ||
					Math.abs(coords.longitude) > 180
				) {
					reject(new Error('Invalid coordinates received from GPS'));
					return;
				}

				console.log('GPS Position received:', {
					lat: coords.latitude,
					lng: coords.longitude,
					accuracy: coords.accuracy
				});

				resolve({
					coords: {
						latitude: coords.latitude,
						longitude: coords.longitude,
						accuracy: coords.accuracy || 0,
						altitude: coords.altitude,
						altitudeAccuracy: coords.altitudeAccuracy,
						heading: coords.heading,
						speed: coords.speed
					},
					timestamp: position.timestamp
				});
			},
			(error) => {
				if (hasReturned) return;
				hasReturned = true;
				clearTimeout(timeout);

				console.error('Geolocation error:', error);
				let errorMessage = 'Failed to get location';
				switch (error.code) {
					case error.PERMISSION_DENIED:
						errorMessage = 'Please allow location access to use this feature';
						break;
					case error.POSITION_UNAVAILABLE:
						errorMessage = 'Location information is unavailable. Please check your GPS settings.';
						break;
					case error.TIMEOUT:
						errorMessage = 'Location request timed out. Please try again.';
						break;
				}
				reject(new Error(errorMessage));
			},
			options
		);
	});
}

export function getCurrentPositionEnhanced(): Promise<Position> {
	return new Promise((resolve, reject) => {
		if (!navigator.geolocation) {
			reject(new Error('Geolocation is not supported by your browser'));
			return;
		}

		let bestPosition: Position | null = null;
		let hasReturned = false;
		let attempts = 0;
		const maxAttempts = 3;

		const finalTimeout = setTimeout(() => {
			if (!hasReturned) {
				hasReturned = true;
				if (bestPosition) {
					console.log('🎯 Returning best position found:', bestPosition);
					resolve(bestPosition);
				} else {
					reject(new Error('Location request timed out after multiple attempts'));
				}
			}
		}, 25000);

		function attemptGeolocation(useHighAccuracy: boolean, maxAge: number) {
			if (hasReturned) return;

			attempts++;
			console.log(
				`🌍 GPS attempt ${attempts}/${maxAttempts} (highAccuracy: ${useHighAccuracy}, maxAge: ${maxAge})`
			);

			const options: PositionOptions = {
				enableHighAccuracy: useHighAccuracy,
				timeout: 8000,
				maximumAge: maxAge
			};

			navigator.geolocation.getCurrentPosition(
				(position) => {
					if (hasReturned) return;

					if (!position || !position.coords) {
						console.warn('⚠️ Invalid position data received');
						tryNextApproach();
						return;
					}

					const { coords } = position;

					if (
						typeof coords.latitude !== 'number' ||
						typeof coords.longitude !== 'number' ||
						isNaN(coords.latitude) ||
						isNaN(coords.longitude) ||
						coords.latitude === 0 ||
						coords.longitude === 0 ||
						Math.abs(coords.latitude) > 90 ||
						Math.abs(coords.longitude) > 180
					) {
						console.warn('⚠️ Invalid coordinates received');
						tryNextApproach();
						return;
					}

					const accuracy = coords.accuracy || Infinity;
					console.log(
						`📍 GPS reading ${attempts}: lat=${coords.latitude.toFixed(6)}, lng=${coords.longitude.toFixed(6)}, accuracy=${accuracy}m`
					);

					const currentPosition: Position = {
						coords: {
							latitude: coords.latitude,
							longitude: coords.longitude,
							accuracy: accuracy,
							altitude: coords.altitude,
							altitudeAccuracy: coords.altitudeAccuracy,
							heading: coords.heading,
							speed: coords.speed
						},
						timestamp: position.timestamp
					};

					if (!bestPosition || accuracy < bestPosition.coords.accuracy) {
						bestPosition = currentPosition;
						console.log(`🎯 New best position! Accuracy: ${accuracy}m`);

						if (accuracy <= 10) {
							hasReturned = true;
							clearTimeout(finalTimeout);
							console.log('🌟 Excellent accuracy achieved, returning immediately');
							resolve(bestPosition);
							return;
						}
					}

					if (attempts >= maxAttempts) {
						hasReturned = true;
						clearTimeout(finalTimeout);
						console.log(
							`✅ Completed all attempts, returning best position (accuracy: ${bestPosition.coords.accuracy}m)`
						);
						resolve(bestPosition);
					} else {
						setTimeout(() => tryNextApproach(), 1000);
					}
				},
				(error) => {
					if (hasReturned) return;

					console.warn(`❌ GPS attempt ${attempts} failed:`, error.message);
					tryNextApproach();
				},
				options
			);
		}

		function tryNextApproach() {
			if (hasReturned) return;

			if (attempts === 1) {
				setTimeout(() => attemptGeolocation(true, 0), 500);
			} else if (attempts === 2) {
				setTimeout(() => attemptGeolocation(false, 5000), 500);
			} else {
				if (bestPosition) {
					hasReturned = true;
					clearTimeout(finalTimeout);
					console.log(
						`✅ Returning best available position (accuracy: ${bestPosition.coords.accuracy}m)`
					);
					resolve(bestPosition);
				} else {
					hasReturned = true;
					clearTimeout(finalTimeout);

					const errorMessage =
						attempts > 0
							? 'Failed to get accurate location after multiple attempts'
							: 'Failed to get location';
					reject(new Error(errorMessage));
				}
			}
		}

		attemptGeolocation(true, 0);
	});
}

export async function reverseGeocode(latitude: number, longitude: number, apiKey?: string) {
	try {
		console.log('Reverse geocoding coordinates:', { latitude, longitude });

		if (
			typeof latitude !== 'number' ||
			typeof longitude !== 'number' ||
			isNaN(latitude) ||
			isNaN(longitude) ||
			latitude === 0 ||
			longitude === 0 ||
			Math.abs(latitude) > 90 ||
			Math.abs(longitude) > 180
		) {
			throw new Error('Invalid coordinates provided for reverse geocoding');
		}
		if (apiKey) {
			try {
				const googleResponse = await fetch(
					`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=en`
				);

				if (!googleResponse.ok) {
					console.warn(
						'Google Geocoding API error:',
						googleResponse.status,
						googleResponse.statusText
					);
					throw new Error(`Google Geocoding API error: ${googleResponse.status}`);
				}

				const googleData = (await googleResponse.json()) as GoogleGeocodingResponse;
				console.log('Google Geocoding response:', googleData);

				if (googleData.status === 'OK' && googleData.results && googleData.results.length > 0) {
					const result = googleData.results[0];
					const address = result.formatted_address || 'Unknown location';

					const addressComponents = result.address_components || [];
					let name = 'Current Location';

					for (const component of addressComponents) {
						if (
							component.types.includes('route') ||
							component.types.includes('street_address') ||
							component.types.includes('establishment') ||
							component.types.includes('point_of_interest')
						) {
							name = component.long_name;
							break;
						}
					}

					if (name === 'Current Location') {
						const premiseComponent = addressComponents.find((c) => c.types.includes('premise'));
						const neighborhoodComponent = addressComponents.find(
							(c) => c.types.includes('neighborhood') || c.types.includes('sublocality')
						);
						name =
							premiseComponent?.long_name || neighborhoodComponent?.long_name || 'Current Location';
					}

					console.log('Parsed Google address:', { name, address });
					return {
						address,
						name,
						details: result
					};
				} else if (googleData.status === 'ZERO_RESULTS') {
					console.warn('Google Geocoding: No results found');
				} else {
					console.warn('Google Geocoding API error:', googleData.status, googleData.error_message);
				}
			} catch (googleError) {
				console.warn('Google Geocoding failed, falling back to OpenStreetMap:', googleError);
			}
		}

		const response = await fetch(
			`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18&accept-language=en`,
			{
				headers: {
					'User-Agent': 'Azumi-App/1.0'
				}
			}
		);
		if (!response.ok) {
			console.error('Reverse geocoding API error:', response.status, response.statusText);
			throw new Error(`Geocoding service error: ${response.status}`);
		}
		const data = (await response.json()) as OpenStreetMapResponse;
		console.log('OpenStreetMap reverse geocoding response:', data);

		if (!data || data.error || typeof data !== 'object') {
			throw new Error('No address found for these coordinates');
		}
		const address = data.display_name || 'Unknown location';
		const addressData = data.address || {};

		if (typeof addressData !== 'object' || addressData === null) {
			console.warn('Address data is not an object:', addressData);
			return {
				address,
				name: 'Current Location',
				details: null
			};
		}
		const name =
			addressData.road ||
			addressData.neighbourhood ||
			addressData.suburb ||
			addressData.town ||
			addressData.city ||
			'Current Location';

		console.log('Parsed OpenStreetMap address:', { name, address });
		return {
			address,
			name,
			details: addressData
		};
	} catch (error) {
		console.error('Error in reverse geocoding:', error);

		return {
			address: `Location (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`,
			name: 'Current Location',
			details: null
		};
	}
}

export interface GeocodeResult {
	latitude: number;
	longitude: number;
	formatted_address: string;
	place_id?: string;
}

interface GoogleGeocodingResponse {
	status: string;
	results?: Array<{
		geometry: {
			location: {
				lat: number;
				lng: number;
			};
		};
		formatted_address: string;
		place_id: string;
		address_components: Array<{
			long_name: string;
			short_name: string;
			types: string[];
		}>;
	}>;
	error_message?: string;
}

export async function geocodeAddress(
	address: string,
	apiKey?: string
): Promise<GeocodeResult | null> {
	try {
		console.log('Geocoding address:', address);

		if (!address || address.trim().length === 0) {
			throw new Error('Invalid address provided for geocoding');
		}

		if (apiKey) {
			try {
				const googleResponse = await fetch(
					`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&language=en`
				);

				if (!googleResponse.ok) {
					console.warn(
						'Google Geocoding API error:',
						googleResponse.status,
						googleResponse.statusText
					);
					throw new Error(`Google Geocoding API error: ${googleResponse.status}`);
				}
				const googleData = (await googleResponse.json()) as GoogleGeocodingResponse;
				console.log('Google Geocoding response:', googleData);

				if (googleData.status === 'OK' && googleData.results && googleData.results.length > 0) {
					const result = googleData.results[0];
					const location = result.geometry?.location;

					if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
						console.log('Parsed Google geocode result:', {
							latitude: location.lat,
							longitude: location.lng,
							formatted_address: result.formatted_address
						});

						return {
							latitude: location.lat,
							longitude: location.lng,
							formatted_address: result.formatted_address,
							place_id: result.place_id
						};
					}
				} else if (googleData.status === 'ZERO_RESULTS') {
					console.warn('Google Geocoding: No results found for address');
				} else {
					console.warn('Google Geocoding API error:', googleData.status, googleData.error_message);
				}
			} catch (googleError) {
				console.warn('Google Geocoding failed, falling back to OpenStreetMap:', googleError);
			}
		}

		const response = await fetch(
			`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&addressdetails=1&limit=1&accept-language=en`,
			{
				headers: {
					'User-Agent': 'Azumi-App/1.0'
				}
			}
		);

		if (!response.ok) {
			console.error('OpenStreetMap geocoding API error:', response.status, response.statusText);
			throw new Error(`Geocoding service error: ${response.status}`);
		}

		const data = await response.json();
		console.log('OpenStreetMap geocoding response:', data);

		if (Array.isArray(data) && data.length > 0) {
			const result = data[0];
			if (result.lat && result.lon) {
				const latitude = parseFloat(result.lat);
				const longitude = parseFloat(result.lon);

				if (!isNaN(latitude) && !isNaN(longitude)) {
					console.log('Parsed OpenStreetMap geocode result:', {
						latitude,
						longitude,
						formatted_address: result.display_name
					});

					return {
						latitude,
						longitude,
						formatted_address: result.display_name || address
					};
				}
			}
		}

		console.warn('No valid geocoding results found for address:', address);
		return null;
	} catch (error) {
		console.error('Error in address geocoding:', error);
		return null;
	}
}
