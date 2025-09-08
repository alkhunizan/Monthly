import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDLKXb0DO78r1Dp8KsL4iLKLAF4yG4CS3A',
  authDomain: 'monthly-ee5fe.firebaseapp.com',
  projectId: 'monthly-ee5fe',
  storageBucket: 'monthly-ee5fe.firebasestorage.app',
  messagingSenderId: '102271009552',
  appId: '1:102271009552:web:38344a6d04b62cbd785b95',
  measurementId: 'G-JHXGWLQ5P1'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
export { app, db, auth };
