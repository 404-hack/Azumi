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

// Updated formatTime to accept "HH:MM" string
export function formatTime(timeString: string | null | undefined): string {
	if (!timeString) return ''; // Return empty string if input is null or undefined
	try {
		const [hours, minutes] = timeString.split(':').map(Number);
		// Create a dummy date object and set the time
		const date = new Date();
		date.setHours(hours, minutes, 0, 0);
		// Format using Intl.DateTimeFormat
		return new Intl.DateTimeFormat('en-US', { timeStyle: 'short' }).format(date);
	} catch (error) {
		console.error(`Error formatting time string "${timeString}":`, error);
		return 'Invalid Time'; // Return an error indicator
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
