
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDPT5ADLfcKcI_HQL3PwiIg_X18e55fWOY",
  authDomain: "adt-microservices-261424-b9a8f.firebaseapp.com",
  databaseURL: "https://adt-microservices-261424-b9a8f-default-rtdb.firebaseio.com",
  projectId: "adt-microservices-261424-b9a8f",
  storageBucket: "adt-microservices-261424-b9a8f.appspot.com",
  messagingSenderId: "646095691233",
  appId: "1:646095691233:web:cf36ab0d959a282a7386a0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);

export { auth, db, storage };
export default app;
