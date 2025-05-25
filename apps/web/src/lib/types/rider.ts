import type { Order } from '../routes/vendor/orders/types';

export type RiderStatus = 'available' | 'unavailable';
export type DeliveryStatus = 'pending' | 'accepted' | 'picked_up' | 'completed' | 'cancelled';

export interface Delivery {
	id: string;
	order: Order;
	status: DeliveryStatus;
	assignedAt: Date;
	acceptedAt?: Date;
	pickedUpAt?: Date;
	completedAt?: Date;
	cancelledAt?: Date;
	deliveryFee: number;
	pickupLocation: {
		address: string;
		lat: number;
		lng: number;
	};
	dropoffLocation: {
		address: string;
		lat: number;
		lng: number;
	};
	distance: number; // in kilometers
	estimatedDuration: number; // in minutes
	actualDuration?: number; // in minutes
	customerContact: {
		name: string;
		phone: string;
	};
	vendorContact: {
		name: string;
		phone: string;
	};
	specialInstructions?: string;
}

export interface RiderProfile {
	id: string;
	name: string;
	phone: string;
	email: string;
	vehicleType: 'motorcycle' | 'bicycle' | 'car';
	vehicleDetails: {
		model: string;
		color: string;
		plateNumber: string;
	};
	rating: number;
	totalDeliveries: number;
	totalEarnings: number;
	status: RiderStatus;
	documents: {
		id: string;
		type: 'license' | 'insurance' | 'registration';
		status: 'pending' | 'verified' | 'rejected';
		url: string;
		expiryDate?: Date;
	}[];
	bankDetails: {
		bankName: string;
		accountNumber: string;
		accountName: string;
	};
}
