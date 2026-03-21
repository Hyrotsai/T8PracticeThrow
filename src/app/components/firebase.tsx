import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';

var initialized = false;

export default function firebase() {
  if (initialized) return;
  initialized = true;

  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: 'AIzaSyBd4vnzxQ3pMVk8KiM4nZYa-mw1azovRVU',
    authDomain: 't8practicethrow.firebaseapp.com',
    projectId: 't8practicethrow',
    storageBucket: 't8practicethrow.firebasestorage.app',
    messagingSenderId: '567195786578',
    appId: '1:567195786578:web:78516f8497247646932e8b',
    measurementId: 'G-ZFX15GQ4VP',
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  console.log('firebase', analytics);
}
