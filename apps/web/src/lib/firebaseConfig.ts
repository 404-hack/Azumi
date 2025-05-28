// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: 'AIzaSyA4c9-n0mDc0qih0BC33GbC_i9XmWH_2J0',
	authDomain: 'azumi-ed6f3.firebaseapp.com',
	projectId: 'azumi-ed6f3',
	storageBucket: 'azumi-ed6f3.firebasestorage.app',
	messagingSenderId: '716036974512',
	appId: '1:716036974512:web:5921d632f404a6fd465875',
	measurementId: 'G-9WFH0Z1HRG'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const messaging = getMessaging(app);
