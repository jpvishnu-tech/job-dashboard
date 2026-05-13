/**
 * firebase-config.js
 * ─────────────────────────────────────────────────────────────
 * Initialises Firebase and exports the Auth instance.
 *
 * Configuration lives in Vite env variables so credentials are
 * never hard-coded.  Create a .env.local file in react-app/ and
 * set each variable below.  The app falls back to JWT-only mode
 * when VITE_FIREBASE_API_KEY is absent or still a placeholder.
 *
 * .env.local example:
 *   VITE_FIREBASE_API_KEY=AIza…
 *   VITE_FIREBASE_AUTH_DOMAIN=my-project.firebaseapp.com
 *   VITE_FIREBASE_PROJECT_ID=my-project
 *   VITE_FIREBASE_STORAGE_BUCKET=my-project.appspot.com
 *   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
 *   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
 *
 * How to get these values:
 *   Firebase console → Project Settings → General →
 *   Your apps → </> Web → firebaseConfig object
 */

import { initializeApp }   from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';

const rawConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Only initialise when a real API key is present
export const isFirebaseConfigured =
  Boolean(rawConfig.apiKey) &&
  !rawConfig.apiKey.startsWith('YOUR_');

let _auth = null;

if (isFirebaseConfigured) {
  const app = initializeApp(rawConfig);
  _auth = getAuth(app);

  // Persist session across browser restarts via IndexedDB
  setPersistence(_auth, browserLocalPersistence).catch((err) =>
    console.warn('[firebase] Could not set persistence:', err.message)
  );
}

/** Firebase Auth instance, or null when Firebase is not configured. */
export const auth = _auth;
