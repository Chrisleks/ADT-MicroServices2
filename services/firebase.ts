
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// Cast import.meta to any to allow access to env property without TS errors
// Use fallback object to prevent crash if env is undefined
const meta = import.meta as any;
const env = meta.env || {};

const apiKey = env.VITE_FIREBASE_API_KEY;
// Basic validation to check if the user has replaced the placeholder
const isConfigured = apiKey && 
                     apiKey !== 'paste_your_apiKey_here' && 
                     apiKey !== 'PLACEHOLDER_API_KEY' &&
                     !apiKey.includes('paste_your');

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  databaseURL: "https://adt-microcredit-services-default-rtdb.firebaseio.com/"
};

let app = null;
let auth = null;
let db = null;
let storage = null;

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getDatabase(app);
    storage = getStorage(app);
  } catch (e) {
    console.error("Firebase Initialization Error:", e);
  }
} else {
  console.warn("⚠️ Firebase API Key missing or invalid. App running in DEMO/LOCAL mode.");
}

export { auth, db, storage };
export default app;
