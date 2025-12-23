// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDZY3z0HoYOGDR1w3byc9TpCauD5SrtjXs",
  authDomain: "market-kumasi.firebaseapp.com",
  projectId: "market-kumasi",
  storageBucket: "market-kumasi.firebasestorage.app",
  messagingSenderId: "698542831190",
  appId: "1:698542831190:web:39da1ddeabd47a9837adf7",
  measurementId: "G-800VNKQJYK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in browser environment)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Initialize Firestore
export const db = getFirestore(app)

// Initialize Authentication
export const auth = getAuth(app)

// Initialize Storage
export const storage = getStorage(app)

export default app

