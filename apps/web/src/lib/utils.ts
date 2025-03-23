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

export function formatDate(date: Date) {
	return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);
}

export function formatTime(date: Date) {
	return new Intl.DateTimeFormat('en-US', { timeStyle: 'short' }).format(date);
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
