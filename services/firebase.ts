
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// FRONTEND MODE: Firebase disabled.
// We export nulls so the App knows to use LocalStorage/Demo mode.

const app = null;
const auth = null;
const db = null;
const storage = null;

export { auth, db, storage };
export default app;
