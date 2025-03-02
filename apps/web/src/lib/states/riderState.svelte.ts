import type { RiderStatus, DeliveryStatus, Delivery } from '$lib/types/rider';

class RiderState {
	isOnline = $state(false);
	currentLocation = $state<{ lat: number; lng: number } | null>(null);
	currentDelivery = $state<Delivery | null>(null);
	deliveryHistory = $state<Delivery[]>([]);
	earnings = $state({
		today: 0,
		week: 0,
		month: 0
	});
	status = $state<RiderStatus>('offline');

	toggleOnline() {
		this.isOnline = !this.isOnline;
		this.status = this.isOnline ? 'available' : 'offline';
	}

	updateLocation(lat: number, lng: number) {
		this.currentLocation = { lat, lng };
	}

	acceptDelivery(delivery: Delivery) {
		this.currentDelivery = delivery;
		this.status = 'on_delivery';
	}

	completeDelivery() {
		if (this.currentDelivery) {
			this.deliveryHistory = [
				...this.deliveryHistory,
				{ ...this.currentDelivery, status: 'completed' }
			];
			this.currentDelivery = null;
			this.status = 'available';
			this.updateEarnings();
		}
	}

	private updateEarnings() {
		// Update earnings based on completed deliveries
		const today = new Date().toDateString();
		const completedToday = this.deliveryHistory.filter(
			(d) => new Date(d.completedAt!).toDateString() === today
		);
		this.earnings.today = completedToday.reduce((sum, d) => sum + d.deliveryFee, 0);
	}
}

export const riderState = new RiderState();
