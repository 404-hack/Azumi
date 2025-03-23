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

export function getCurrentPosition(): Promise<Position> {
	return new Promise((resolve, reject) => {
		if (!navigator.geolocation) {
			reject(new Error('Geolocation is not supported by your browser'));
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				resolve({
					coords: {
						latitude: position.coords.latitude,
						longitude: position.coords.longitude,
						accuracy: position.coords.accuracy,
						altitude: position.coords.altitude,
						altitudeAccuracy: position.coords.altitudeAccuracy,
						heading: position.coords.heading,
						speed: position.coords.speed
					},
					timestamp: position.timestamp
				});
			},
			(error) => {
				let errorMessage = 'Failed to get location';
				switch (error.code) {
					case error.PERMISSION_DENIED:
						errorMessage = 'Please allow location access to use this feature';
						break;
					case error.POSITION_UNAVAILABLE:
						errorMessage = 'Location information is unavailable';
						break;
					case error.TIMEOUT:
						errorMessage = 'Location request timed out';
						break;
				}
				reject(new Error(errorMessage));
			},
			{
				enableHighAccuracy: true,
				timeout: 5000,
				maximumAge: 0
			}
		);
	});
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
	try {
		const response = await fetch(
			`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
		);

		if (!response.ok) {
			throw new Error('Failed to get address');
		}

		const data = await response.json();
		console.log('🚀 ~ reverseGeocode ~ data:', data);
		return data.display_name;
	} catch (error) {
		console.error('Error in reverse geocoding:', error);
		throw new Error('Could not convert location to address');
	}
}
