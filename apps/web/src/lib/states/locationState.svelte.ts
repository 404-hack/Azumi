import type { Place } from '$lib/types/places';
import { PersistedState } from 'runed';

export const activeLocation = new PersistedState<Place>('activeLocation', {
	name: '',
	address: '',
	lat: 0,
	lng: 0
});
