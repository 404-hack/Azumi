import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
	return new Intl.NumberFormat('en-NG', {
		style: 'currency',
		currency: 'NGN',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(amount);
}

export function formatDate(date: string | number | Date | null | undefined) {
	if (!date) return '';
	try {
		const dateObject = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
		return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(dateObject);
	} catch (error) {
		console.error('Error formatting date:', error);
		return '';
	}
}

export function formatDateTime(date: string | number | Date | null | undefined) {
	if (!date) return '';
	try {
		const dateObject = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
		return new Intl.DateTimeFormat('en-US', {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(dateObject);
	} catch (_error) {
		console.error('Error formatting date time:', _error);
		return '';
	}
}

// Updated formatTime to accept "HH:MM" string
export function formatTime(timeString: string | null | undefined): string {
	if (!timeString) return '';

	try {
		let date: Date;

		if (timeString.includes('T') || timeString.includes('Z')) {
			date = new Date(timeString);
		} else {
			const parts = timeString.split(':');
			if (parts.length < 2) return 'Invalid Time';

			const [hours, minutes] = parts.map(Number);

			if (
				isNaN(hours) ||
				isNaN(minutes) ||
				hours < 0 ||
				hours > 23 ||
				minutes < 0 ||
				minutes > 59
			) {
				return 'Invalid Time';
			}

			date = new Date();
			date.setHours(hours, minutes, 0, 0);
		}

		if (isNaN(date.getTime())) {
			return 'Invalid Time';
		}

		return new Intl.DateTimeFormat('en-US', { timeStyle: 'short' }).format(date);
	} catch (error) {
		return 'Invalid Time';
	}
}

export function initials(name?: string) {
	return (
		name
			?.split(' ')
			.map((n) => n.charAt(0))
			.join('')
			.toUpperCase() ?? ''
	);
}
