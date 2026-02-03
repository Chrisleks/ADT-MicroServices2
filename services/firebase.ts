
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database'; // Changed from getFirestore
import { getStorage } from 'firebase/storage';

// Safe access to environment variables
const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  // Realtime Database URL is derived from project ID or explicitly set if needed
  databaseURL: `https://${env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`, 
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

let app = null;
let auth = null;
let db = null;
let storage = null;

// Heuristic to check if key is likely valid (not empty, not placeholder)
const isKeyValid = (key: string | undefined) => {
    return key && key.length > 20 && !key.includes('PLACEHOLDER') && !key.includes('your_api_key');
};

if (isKeyValid(firebaseConfig.apiKey)) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getDatabase(app); // Initialize Realtime Database
    storage = getStorage(app);
  } catch (e) {
    console.error("Firebase initialization failed:", e);
    // Reset to null to trigger Demo Mode in App.tsx
    app = null; auth = null; db = null; storage = null;
  }
} else {
  console.warn("Firebase API Key missing or invalid (Demo Mode Active).");
}

export { auth, db, storage };
export default app;
