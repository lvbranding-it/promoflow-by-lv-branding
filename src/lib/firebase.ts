
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  "projectId": process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  "appId": process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  "storageBucket": process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  "apiKey": process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  "authDomain": process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  "messagingSenderId": process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

// Initialize Firebase app only once
export const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export getter functions for Firebase services
export function getFirestoreInstance() {
  if (typeof window !== 'undefined') {
    return getFirestore(app);
  }
  return undefined;
}

export function getAuthInstance() {
  if (typeof window !== 'undefined') {
    return getAuth(app);
  }
  return undefined;
}

export function getStorageInstance() {
  if (typeof window !== 'undefined') {
    return getStorage(app);
  }
  return undefined;
}
