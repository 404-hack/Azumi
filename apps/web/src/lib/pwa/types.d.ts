declare global {
	// Add type definitions for service worker and push notifications

	// Extended WindowEventMap to include PWA-related events
	interface WindowEventMap {
		beforeinstallprompt: BeforeInstallPromptEvent;
		appinstalled: Event;
	}

	// beforeinstallprompt event
	interface BeforeInstallPromptEvent extends Event {
		readonly platforms: string[];
		prompt(): Promise<void>;
		readonly userChoice: Promise<{
			outcome: 'accepted' | 'dismissed';
			platform: string;
		}>;
	}

	// Push notification related types
	interface PushSubscriptionChangeEvent extends Event {
		readonly newSubscription: PushSubscription | null;
		readonly oldSubscription: PushSubscription | null;
	}

	// Additional types for the service worker
	interface NotificationOptions {
		body?: string;
		icon?: string;
		badge?: string;
		image?: string;
		tag?: string;
		data?: any;
		silent?: boolean;
		actions?: NotificationAction[];
		renotify?: boolean;
		requireInteraction?: boolean;
		vibrate?: number[];
	}

	interface NotificationAction {
		action: string;
		title: string;
		icon?: string;
	}
}

export {};
