import { getAnalytics } from 'firebase/analytics';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBd4vnzxQ3pMVk8KiM4nZYa-mw1azovRVU',
  authDomain: 't8practicethrow.firebaseapp.com',
  projectId: 't8practicethrow',
  storageBucket: 't8practicethrow.firebasestorage.app',
  messagingSenderId: '567195786578',
  appId: '1:567195786578:web:78516f8497247646932e8b',
  measurementId: 'G-ZFX15GQ4VP',
};

// Initialize only once (React StrictMode / HMR safety)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);

export default function firebase() {
  getAnalytics(app);
}
