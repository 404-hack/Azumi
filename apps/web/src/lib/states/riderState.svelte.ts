import type { RiderStatus, DeliveryStatus, Delivery } from '$lib/types/rider';

class RiderState {
	isActive = $state(false);
	currentLocation = $state<{ lat: number; lng: number } | null>(null);
	currentDelivery = $state<Delivery | null>(null);
	deliveryHistory = $state<Delivery[]>([]);
	earnings = $state({
		today: 0,
		week: 0,
		month: 0
	});
	status = $state<RiderStatus>('idle');

	toggleActive() {
		this.isActive = !this.isActive;

		// Update backend when rider goes online/offline
		this.updateActiveStatus();
	}

	async updateActiveStatus() {
		try {
			const response = await fetch('/api/rider/active-status', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					active: this.isActive
				})
			});

			if (!response.ok) {
				// Reset to previous state if API call fails
				this.isActive = !this.isActive;
				console.error('Failed to update active status');
			}
		} catch (error) {
			// Reset to previous state if API call fails
			this.isActive = !this.isActive;
			console.error('Error updating active status:', error);
		}
	}

	updateLocation(lat: number, lng: number) {
		this.currentLocation = { lat, lng };
	}
	acceptDelivery(delivery: Delivery) {
		this.currentDelivery = delivery;
		this.status = 'picking_up';
	}

	startDelivery() {
		if (this.currentDelivery) {
			this.status = 'delivering';
			this.currentDelivery = {
				...this.currentDelivery,
				status: 'picked_up',
				pickedUpAt: new Date()
			};
		}
	}

	completeDelivery() {
		if (this.currentDelivery) {
			this.deliveryHistory = [
				...this.deliveryHistory,
				{ ...this.currentDelivery, status: 'completed', completedAt: new Date() }
			];
			this.currentDelivery = null;
			this.status = 'idle';
			this.updateEarnings();
		}
	}

	setBreakStatus(onBreak: boolean) {
		if (onBreak) {
			this.status = 'on_break';
		} else {
			this.status = this.currentDelivery ? 'delivering' : 'idle';
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
