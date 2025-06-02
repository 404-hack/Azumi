import { browser } from '$app/environment';
import { toast } from 'svelte-sonner';
import { client } from '$lib/hc';

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

class OrderAcceptanceState {	isVisible = $state(false);
	currentOrder = $state<OrderDetails | null>(null);
	timeLeft = $state(30);
	isAccepting = $state(false);
	isRejecting = $state(false);
	hasResponded = $state(false);
	urgencyLevel = $state<UrgencyLevel>('normal');
	
	private countdownInterval: NodeJS.Timeout | null = null;

	showOrderOffer(order: OrderDetails) {
		console.log('🚨 OrderAcceptanceState: showOrderOffer called with:', order);
		
		if (this.isVisible) {
			console.log('⚠️ OrderAcceptanceState: Modal already visible, replacing current order');
		}
				this.currentOrder = order;
		this.isVisible = true;
		this.hasResponded = false;
		this.timeLeft = 30;
		this.urgencyLevel = 'normal';
		
		console.log('✅ OrderAcceptanceState: Modal state set to visible');
		console.log('📊 OrderAcceptanceState: Current state:', {
			isVisible: this.isVisible,
			currentOrder: this.currentOrder,
			timeLeft: this.timeLeft
		});
		
		this.startCountdown();
		this.playNotificationSound();
		this.triggerVibration();

		console.log('📱 Order offer displayed:', order.id);
	}
	hideOrderOffer() {
		console.log('🚪 OrderAcceptanceState: Hiding modal and cleaning up');
		
		this.isVisible = false;
		this.currentOrder = null;
		this.hasResponded = false;
		this.timeLeft = 30;
		this.urgencyLevel = 'normal';
		this.cleanup();
		
		console.log('✅ OrderAcceptanceState: Modal hidden and state reset');
	}

	private startCountdown() {
		console.log('⏰ OrderAcceptanceState: Starting 30-second countdown timer');
		
		this.cleanup();
				this.countdownInterval = setInterval(() => {
			this.timeLeft--;
			console.log(`⏱️ OrderAcceptanceState: Timer tick - ${this.timeLeft} seconds remaining`);
			
			if (this.timeLeft <= 10) {
				this.urgencyLevel = 'critical';
				console.log('🔴 OrderAcceptanceState: Entering CRITICAL urgency (≤10s)');
			} else if (this.timeLeft <= 15) {
				this.urgencyLevel = 'urgent';
				console.log('🟠 OrderAcceptanceState: Entering URGENT urgency (≤15s)');
			}
			
			if (this.timeLeft <= 0) {
				console.log('⏰ OrderAcceptanceState: Timer expired - auto-closing modal');
				this.hideModal();
			}
		}, 1000);
	}
	private cleanup() {
		if (this.countdownInterval) {
			console.log('🧹 OrderAcceptanceState: Clearing countdown interval');
			clearInterval(this.countdownInterval);
			this.countdownInterval = null;
		}
	}
	private playNotificationSound() {
		console.log('🔊 OrderAcceptanceState: Attempting to play notification sound');
		
		if (browser) {
			try {
				const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
				const oscillator = audioContext.createOscillator();
				const gainNode = audioContext.createGain();
				
				oscillator.connect(gainNode);
				gainNode.connect(audioContext.destination);
				
				oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
				oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
				oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
				
				gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
				gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
				
				oscillator.start(audioContext.currentTime);
				oscillator.stop(audioContext.currentTime + 0.3);
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
		
		console.log('📤 OrderAcceptanceState: Sending accept request to server...', {
			orderId: this.currentOrder.id
		});

		try {
			const response = await client.rider.dispatch['accept-order'][':orderId'].$post({
				param: { orderId: this.currentOrder.id }
			});

			if (response.ok) {
				console.log('🎉 OrderAcceptanceState: Order accepted successfully!');
				toast.success('Order accepted! Navigating to details...');
				this.hideModal();
			} else {
				console.error('❌ OrderAcceptanceState: Accept request failed:', response.status);
				const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
				toast.error(errorData.message || 'Failed to accept order');
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
		
		console.log('📤 OrderAcceptanceState: Sending reject request to server...', {
			orderId: this.currentOrder.id
		});

		try {
			const response = await client.rider.dispatch['reject-order'][':orderId'].$post({
				param: { orderId: this.currentOrder.id }
			});

			if (response.ok) {
				console.log('✅ OrderAcceptanceState: Order rejected successfully');
				toast.success('Order declined');
				this.hideModal();
			} else {
				console.error('❌ OrderAcceptanceState: Reject request failed:', response.status);
				const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
				toast.error(errorData.message || 'Failed to reject order');
				this.hasResponded = false;
			}
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
		this.urgencyLevel = 'normal';
		this.cleanup();		
		console.log('✅ OrderAcceptanceState: Modal hidden and state reset');
	}

	destroy() {
		console.log('💀 OrderAcceptanceState: Destroying state and cleaning up');
		this.cleanup();
	}
}

export const orderAcceptanceState = new OrderAcceptanceState();
