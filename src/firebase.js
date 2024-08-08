import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "APIKEY",
    authDomain: "DOMAIN",
    projectId: "PROJECT",
    storageBucket: "PROJECT_STORAGE",
    messagingSenderId: "SENDER_ID",
    appId: "APP_ID",
    measurementId: "MEASUREMENT_ID"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
const auth = getAuth(app);
const firestore = getFirestore(app);

export { auth, firestore };
