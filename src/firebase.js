import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAmfMeIrGF47znFqNbsgENmzlA6i4iuG74",
    authDomain: "movie-campaign.firebaseapp.com",
    projectId: "movie-campaign",
    storageBucket: "movie-campaign.appspot.com",
    messagingSenderId: "508614699542",
    appId: "1:508614699542:web:569c5a6cc69f62facee337",
    measurementId: "G-WSY57ZKPSE"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
const auth = getAuth(app);
const firestore = getFirestore(app);

export { auth, firestore };