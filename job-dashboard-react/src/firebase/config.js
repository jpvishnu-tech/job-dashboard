import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey:            'AIzaSyARxyufXXWbumrM0OEWT-5AAsd64jZVtOw',
  authDomain:        'job-dashboard-f74f1.firebaseapp.com',
  projectId:         'job-dashboard-f74f1',
  storageBucket:     'job-dashboard-f74f1.firebasestorage.app',
  messagingSenderId: '61222394146',
  appId:             '1:61222394146:web:5f1d617bb9b2ab5881ad7b',
  measurementId:     'G-SLJH3FJ6X7',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);
export default app;
