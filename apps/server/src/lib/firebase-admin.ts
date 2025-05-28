import admin from 'firebase-admin'

interface FirebaseConfig {
	projectId: string
	clientEmail: string
	privateKey: string
}

let app: admin.app.App | null = null

export function initializeFirebaseAdmin(config: FirebaseConfig) {
	if (!app) {
		app = admin.initializeApp({
			credential: admin.credential.cert({
				projectId: config.projectId,
				clientEmail: config.clientEmail,
				privateKey: config.privateKey.replace(/\\n/g, '\n')
			}),
			projectId: config.projectId
		})
	}
	return app
}

export function getFirebaseAdmin() {
	if (!app) {
		throw new Error('Firebase Admin not initialized')
	}
	return app
}

export const messaging = () => admin.messaging(getFirebaseAdmin())
