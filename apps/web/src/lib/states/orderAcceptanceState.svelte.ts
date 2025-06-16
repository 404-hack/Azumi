import { browser } from '$app/environment';
import { toast } from 'svelte-sonner';
import { client } from '$lib/hc';
import { riderDispatchState } from './riderDispatchState.svelte';

console.log('🔄 OrderAcceptanceState: Module loaded');

interface OrderDetails {
	id: string;
	shopId: string;
	pickupLocation: {
		lat: number;
		lng: number;
		address: string;
	};
	deliveryLocation: {
		lat: number;
		lng: number;
		address: string;
	};
	orderValue: number;
	deliveryFee: number;
	estimatedDistance: number;
	estimatedDuration: number;
	itemCount: number;
	createdAt: string;
}

type UrgencyLevel = 'normal' | 'urgent' | 'critical';

class OrderAcceptanceState {
	isVisible = $state(false);
	currentOrder = $state<OrderDetails | null>(null);
	isAccepting = $state(false);
	isRejecting = $state(false);
	hasResponded = $state(false);
	timeLeft = $state(30);
	private countdownInterval: NodeJS.Timeout | null = null;

	urgencyLevel = $derived((): UrgencyLevel => {
		if (this.timeLeft <= 10) return 'critical';
		if (this.timeLeft <= 15) return 'urgent';
		return 'normal';
	});
	showOrderOffer(order: OrderDetails) {
		console.log('🚨 OrderAcceptanceState: showOrderOffer called with:', order);

		// Force cleanup any existing state first
		if (this.isVisible) {
			console.log(
				'⚠️ OrderAcceptanceState: Modal already visible, force cleaning before showing new order'
			);
			this.cleanup();
		}

		// Reset all state completely
		this.currentOrder = order;
		this.isVisible = true;
		this.hasResponded = false;
		this.timeLeft = 30;

		// Start countdown timer
		this.startCountdown();

		console.log('✅ OrderAcceptanceState: Modal state set to visible');
		console.log('📊 OrderAcceptanceState: Current state:', {
			isVisible: this.isVisible,
			currentOrder: this.currentOrder,
			timeLeft: this.timeLeft,
			hasResponded: this.hasResponded
		});

		this.playNotificationSound();
		this.triggerVibration();

		console.log('📱 Order offer displayed:', order.id);
	}
	hideOrderOffer() {
		console.log('🚪 OrderAcceptanceState: Hiding modal and cleaning up');

		this.isVisible = false;
		this.currentOrder = null;
		this.hasResponded = false;
		this.timeLeft = 30; // Reset timer
		this.cleanup();

		console.log('✅ OrderAcceptanceState: Modal hidden and state reset');
	}
	private cleanup() {
		console.log('🧹 OrderAcceptanceState: Cleaning up countdown timer');
		if (this.countdownInterval) {
			clearInterval(this.countdownInterval);
			this.countdownInterval = null;
		}
	}
	private startCountdown() {
		console.log('⏱️ OrderAcceptanceState: Starting 30-second countdown');

		// Clear any existing countdown
		if (this.countdownInterval) {
			clearInterval(this.countdownInterval);
		}

		this.countdownInterval = setInterval(() => {
			this.timeLeft--;
			console.log(`⏰ OrderAcceptanceState: Timer countdown - ${this.timeLeft}s remaining`);

			if (this.timeLeft <= 0) {
				console.log('⏰ OrderAcceptanceState: Timer expired, auto-rejecting order');
				// Clear interval immediately to prevent negative numbers
				if (this.countdownInterval) {
					clearInterval(this.countdownInterval);
					this.countdownInterval = null;
				}
				this.timeLeft = 0; // Ensure it stays at 0
				this.autoRejectOrder();
			}
		}, 1000);
	}
	private async autoRejectOrder() {
		if (!this.currentOrder || this.hasResponded) return;

		console.log('⚡ OrderAcceptanceState: Auto-rejecting order due to timeout');

		const orderId = this.currentOrder.id;
		this.hasResponded = true;

		// Clear dispatch state immediately for timeout case
		await riderDispatchState.rejectOrder(orderId);

		// Hide modal and reset state
		this.hideModal();

		console.log('✅ OrderAcceptanceState: Auto-rejection completed, modal hidden');
	}
	private playNotificationSound() {
		console.log('🔊 OrderAcceptanceState: Attempting to play notification sound');

		if (browser) {
			try {
				const audioContext = new (window.AudioContext ||
					(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

				const playTone = (frequency: number, startTime: number, duration: number) => {
					const oscillator = audioContext.createOscillator();
					const gainNode = audioContext.createGain();

					oscillator.connect(gainNode);
					gainNode.connect(audioContext.destination);

					oscillator.frequency.setValueAtTime(frequency, startTime);
					gainNode.gain.setValueAtTime(0.3, startTime);
					gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

					oscillator.start(startTime);
					oscillator.stop(startTime + duration);
				};

				const now = audioContext.currentTime;
				playTone(800, now, 0.3);
				playTone(600, now + 0.4, 0.3);
				playTone(800, now + 0.8, 0.3);
				playTone(1000, now + 1.2, 0.5);
			} catch (error) {
				console.warn('Could not play notification sound:', error);
			}
		}
	}

	private triggerVibration() {
		console.log('📳 OrderAcceptanceState: Attempting to trigger vibration');
		if (browser && 'vibrate' in navigator) {
			navigator.vibrate([200, 100, 200, 100, 200]);
			console.log('✅ OrderAcceptanceState: Vibration triggered');
		}
	}
	async acceptOrder() {
		console.log('✅ OrderAcceptanceState: Accept button clicked');

		if (!this.currentOrder || this.hasResponded) {
			console.log('⚠️ OrderAcceptanceState: Cannot accept - no order or already responded');
			return;
		}

		this.isAccepting = true;
		this.hasResponded = true;
		const orderId = this.currentOrder.id;

		console.log('📤 OrderAcceptanceState: Sending accept request to server...', {
			orderId: orderId
		});
		try {
			const response = await client.rider.dispatch['accept-order'][':orderId'].$post({
				param: { orderId: orderId }
			});
			if (response.ok) {
				console.log('🎉 OrderAcceptanceState: Order accepted successfully!');
				// Update dispatch state first
				await riderDispatchState.acceptOrder(orderId);
				toast.success('Order accepted! Navigating to details...');
				this.hideModal();

				// Navigate to active delivery page
				await import('$app/navigation').then(({ goto }) => {
					goto('/rider/deliveries/active');
				});
			} else {
				console.error('❌ OrderAcceptanceState: Accept request failed:', response.status);
				const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
				const message =
					'error' in errorData
						? errorData.error
						: 'message' in errorData
							? errorData.message
							: 'Failed to accept order';
				toast.error(message);
				this.hasResponded = false;
			}
		} catch (error) {
			console.error('💥 OrderAcceptanceState: Accept request error:', error);
			toast.error('Network error. Please try again.');
			this.hasResponded = false;
		} finally {
			this.isAccepting = false;
			console.log('🔄 OrderAcceptanceState: Accept operation completed');
		}
	}
	async rejectOrder() {
		console.log('❌ OrderAcceptanceState: Reject button clicked');

		if (!this.currentOrder || this.hasResponded) {
			console.log('⚠️ OrderAcceptanceState: Cannot reject - no order or already responded');
			return;
		}

		this.isRejecting = true;
		this.hasResponded = true;
		const orderId = this.currentOrder.id;

		console.log('📤 OrderAcceptanceState: Sending reject request to server...', {
			orderId: orderId
		});
		try {
			// Since reject-order endpoint doesn't exist, we'll just handle it locally
			console.log('✅ OrderAcceptanceState: Order rejected locally');
			// Update dispatch state first
			await riderDispatchState.rejectOrder(orderId);
			toast.success('Order declined');
			this.hideModal();
		} catch (error) {
			console.error('💥 OrderAcceptanceState: Reject request error:', error);
			toast.error('Network error. Please try again.');
			this.hasResponded = false;
		} finally {
			this.isRejecting = false;
			console.log('🔄 OrderAcceptanceState: Reject operation completed');
		}
	}
	private hideModal() {
		console.log('🚪 OrderAcceptanceState: Hiding modal and cleaning up');

		this.isVisible = false;
		this.currentOrder = null;
		this.hasResponded = false;
		this.timeLeft = 30;
		this.cleanup();
		console.log('✅ OrderAcceptanceState: Modal hidden and state reset');
	}

	destroy() {
		console.log('💀 OrderAcceptanceState: Destroying state and cleaning up');
		this.cleanup();
	}

	// Computed properties for the modal using $derived
	estimatedEarnings = $derived(
		!this.currentOrder
			? '0'
			: (() => {
					const platformCommission = 0.0;
					const earnings = this.currentOrder.deliveryFee * (1 - platformCommission);
					return Math.round(earnings).toLocaleString();
				})()
	);

	formattedTimeRemaining = $derived(this.timeLeft.toString().padStart(2, '0'));

	totalOrderValue = $derived(
		!this.currentOrder ? '0' : this.currentOrder.orderValue.toLocaleString()
	);

	deliveryFeeFormatted = $derived(
		!this.currentOrder ? '0' : this.currentOrder.deliveryFee.toLocaleString()
	);
}

export const orderAcceptanceState = new OrderAcceptanceState();
