import { formatTime } from '$lib/utils';

// Define the type for operating hours based on your schema
type OperatingHour = {
	day: string;
	openTime: string | null;
	closeTime: string | null;
	isOpen: boolean | null;
};

export function getShopOpeningInfo(operatingHours: OperatingHour[] | undefined | null): {
	isOpenNow: boolean;
	willOpenToday: boolean;
	opensAt: string | null;
	closesAt: string | null;
} {
	const defaultValue = { isOpenNow: false, willOpenToday: false, opensAt: null, closesAt: null };
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
		return defaultValue; // Closed all day or no data
	}

	const [openHour, openMinute] = todayHours.openTime.split(':').map(Number);
	const openTimeInMinutes = openHour * 60 + openMinute;

	const [closeHour, closeMinute] = todayHours.closeTime.split(':').map(Number);
	// Handle overnight closing times (e.g., closes at 02:00)
	let closeTimeInMinutes = closeHour * 60 + closeMinute;
	if (closeTimeInMinutes < openTimeInMinutes) {
		closeTimeInMinutes += 24 * 60; // Add 24 hours if close time is on the next day
	}

	// Adjust current time if checking for overnight closing
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
