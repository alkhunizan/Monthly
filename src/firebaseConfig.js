import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyDLKXb0DO78r1Dp8KsL4iLKLAF4yG4CS3A',
  authDomain: 'monthly-ee5fe.firebaseapp.com',
  projectId: 'monthly-ee5fe',
  storageBucket: 'monthly-ee5fe.firebasestorage.app',
  messagingSenderId: '102271009552',
  appId: '1:102271009552:web:38344a6d04b62cbd785b95',
  measurementId: 'G-JHXGWLQ5P1'
};

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
