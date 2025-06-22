import { formatTime } from '$lib/utils';

// Define the type for operating hours based on your schema
type OperatingHour = {
	day: string;
	openTime: string | null;
	closeTime: string | null;
	isOpen: boolean | null;
};

export function getShopOpeningInfo(
	operatingHours: OperatingHour[] | undefined | null,
	isOpen?: boolean
): {
	isOpenNow: boolean;
	willOpenToday: boolean;
	opensAt: string | null;
	closesAt: string | null;
} {
	const defaultValue = { isOpenNow: false, willOpenToday: false, opensAt: null, closesAt: null };

	// If server provides isOpen status, use it for isOpenNow
	// This ensures inactive shops are always considered closed
	if (isOpen !== undefined) {
		// If shop is closed according to server (inactive or outside hours)
		if (!isOpen) {
			// Still check if it will open today based on operating hours
			if (!operatingHours) {
				return defaultValue;
			}

			const now = new Date();
			const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
			const today = days[now.getDay()];
			const currentHour = now.getHours();
			const currentMinute = now.getMinutes();
			const currentTimeInMinutes = currentHour * 60 + currentMinute;

			const todayHours = operatingHours.find((h) => h.day.toUpperCase() === today.toUpperCase());

			if (
				!todayHours ||
				todayHours.isOpen === false ||
				!todayHours.openTime ||
				!todayHours.closeTime
			) {
				return defaultValue;
			}

			const [openHour, openMinute] = todayHours.openTime.split(':').map(Number);
			const openTimeInMinutes = openHour * 60 + openMinute;

			// Check if shop will open later today (only if currently before opening time)
			if (currentTimeInMinutes < openTimeInMinutes) {
				return {
					isOpenNow: false,
					willOpenToday: true,
					opensAt: formatTime(todayHours.openTime),
					closesAt: null
				};
			}

			return defaultValue;
		} else {
			// Shop is open according to server, find closing time
			if (!operatingHours) {
				return { isOpenNow: true, willOpenToday: false, opensAt: null, closesAt: null };
			}

			const now = new Date();
			const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
			const today = days[now.getDay()];

			const todayHours = operatingHours.find((h) => h.day.toUpperCase() === today.toUpperCase());

			if (todayHours && todayHours.closeTime) {
				return {
					isOpenNow: true,
					willOpenToday: false,
					opensAt: null,
					closesAt: formatTime(todayHours.closeTime)
				};
			}

			return { isOpenNow: true, willOpenToday: false, opensAt: null, closesAt: null };
		}
	}

	// Fallback to original logic if no server isOpen status provided
	if (!operatingHours) {
		return defaultValue;
	}

	const now = new Date();
	const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
	const today = days[now.getDay()];
	const currentHour = now.getHours();
	const currentMinute = now.getMinutes();
	const currentTimeInMinutes = currentHour * 60 + currentMinute;

	const todayHours = operatingHours.find((h) => h.day.toUpperCase() === today.toUpperCase());

	if (!todayHours || todayHours.isOpen === false || !todayHours.openTime || !todayHours.closeTime) {
		return defaultValue;
	}

	const [openHour, openMinute] = todayHours.openTime.split(':').map(Number);
	const openTimeInMinutes = openHour * 60 + openMinute;

	const [closeHour, closeMinute] = todayHours.closeTime.split(':').map(Number);
	let closeTimeInMinutes = closeHour * 60 + closeMinute;
	if (closeTimeInMinutes < openTimeInMinutes) {
		closeTimeInMinutes += 24 * 60;
	}

	const adjustedCurrentTime =
		currentTimeInMinutes < openTimeInMinutes && closeTimeInMinutes > 24 * 60
			? currentTimeInMinutes + 24 * 60
			: currentTimeInMinutes;

	const isOpenNow =
		adjustedCurrentTime >= openTimeInMinutes && adjustedCurrentTime < closeTimeInMinutes;

	if (isOpenNow) {
		return {
			isOpenNow: true,
			willOpenToday: false,
			opensAt: null,
			closesAt: formatTime(todayHours.closeTime)
		};
	} else if (currentTimeInMinutes < openTimeInMinutes) {
		// It's before opening time today
		return {
			isOpenNow: false,
			willOpenToday: true,
			opensAt: formatTime(todayHours.openTime),
			closesAt: null
		};
	} else {
		// It's after closing time today
		return {
			isOpenNow: false,
			willOpenToday: false,
			opensAt: null,
			closesAt: null
		};
	}
}
// import { formatTime } from '$lib/utils';

// // Define the type for operating hours based on your schema
// type OperatingHour = {
// 	day: string;
// 	openTime: string | null;
// 	closeTime: string | null;
// 	isOpen: boolean | null;
// };

// export function getShopOpeningInfo(
// 	operatingHours: OperatingHour[] | undefined | null,
// 	isOpen: boolean = false
// ): {
// 	willOpenToday: boolean;
// 	opensAt: string | null;
// } {
// 	// If already open, no need to show opening info
// 	if (isOpen) {
// 		return { willOpenToday: false, opensAt: null };
// 	}

// 	const now = new Date();
// 	const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
// 	const today = days[now.getDay()];

// 	const todayHours = operatingHours?.find((h) => h.day.toUpperCase() === today.toUpperCase());

// 	// If no hours for today or explicitly closed
// 	if (!todayHours || todayHours.isOpen === false || !todayHours.openTime || !todayHours.closeTime) {
// 		return { willOpenToday: false, opensAt: null };
// 	}

// 	// Convert current time to minutes since midnight
// 	const currentHour = now.getHours();
// 	const currentMinute = now.getMinutes();
// 	const currentTimeInMinutes = currentHour * 60 + currentMinute;

// 	// Convert opening hours to minutes since midnight
// 	const [openHour, openMinute] = todayHours.openTime.split(':').map(Number);
// 	const openTimeInMinutes = openHour * 60 + openMinute;

// 	// If not yet open today
// 	if (currentTimeInMinutes < openTimeInMinutes) {
// 		return {
// 			willOpenToday: true,
// 			opensAt: formatTime(todayHours.openTime) // Use imported formatTime
// 		};
// 	}

// 	// Already closed for the day (or was never open)
// 	return { willOpenToday: false, opensAt: null };
// }
